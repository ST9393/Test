import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { parsePDF, parseURL, parseText, validateDocumentContent } from '@/lib/document-processing/parsers'
import { smartChunkText } from '@/lib/document-processing/chunker'
import { generateEmbedding } from '@/lib/openai/client'

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID requis' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Update agent status to training
    await supabaseAdmin
      .from('agents')
      .update({ training_status: 'training' })
      .eq('id', agentId)

    // Get all pending documents for this agent
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'pending')

    if (!documents || documents.length === 0) {
      await supabaseAdmin
        .from('agents')
        .update({
          training_status: 'completed',
          is_trained: true
        })
        .eq('id', agentId)

      return NextResponse.json({ message: 'Aucun document à traiter' })
    }

    // Process each document
    for (const doc of documents) {
      try {
        // Update document status
        await supabaseAdmin
          .from('documents')
          .update({ status: 'processing' })
          .eq('id', doc.id)

        let content = ''

        // Parse based on type
        if (doc.type === 'pdf' && doc.source_url) {
          // Fetch PDF from storage
          const response = await fetch(doc.source_url)
          const buffer = await response.arrayBuffer()
          content = await parsePDF(Buffer.from(buffer))
        } else if (doc.type === 'url' && doc.source_url) {
          content = await parseURL(doc.source_url)
        } else if (doc.type === 'text' && doc.content) {
          content = parseText(doc.content)
        }

        // Validate content
        if (!validateDocumentContent(content)) {
          throw new Error('Contenu du document invalide ou trop court')
        }

        // Chunk the content
        const chunks = smartChunkText(content, doc.name)

        // Generate embeddings and store
        for (const chunk of chunks) {
          const embedding = await generateEmbedding(chunk.content)

          await supabaseAdmin
            .from('embeddings')
            .insert({
              document_id: doc.id,
              agent_id: agentId,
              content: chunk.content,
              embedding: embedding,
              metadata: chunk.metadata,
            })
        }

        // Update document status
        await supabaseAdmin
          .from('documents')
          .update({
            status: 'completed',
            chunk_count: chunks.length
          })
          .eq('id', doc.id)

      } catch (error: any) {
        console.error(`Error processing document ${doc.id}:`, error)

        await supabaseAdmin
          .from('documents')
          .update({ status: 'failed' })
          .eq('id', doc.id)
      }
    }

    // Update agent status to completed
    await supabaseAdmin
      .from('agents')
      .update({
        training_status: 'completed',
        is_trained: true
      })
      .eq('id', agentId)

    return NextResponse.json({
      message: 'Entraînement terminé',
      documentsProcessed: documents.length
    })

  } catch (error: any) {
    console.error('Training error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'entraînement' },
      { status: 500 }
    )
  }
}
