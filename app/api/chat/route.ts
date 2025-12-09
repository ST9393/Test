import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { generateEmbedding, generateChatCompletion, calculateConfidence } from '@/lib/openai/client'
import { sanitizeInput, checkRateLimit } from '@/lib/utils'
import { detectActionIntent, extractActionParams, formatActionResponse, executeAction } from '@/lib/ai-actions'

export async function POST(request: Request) {
  try {
    const { agentId, message, conversationId, sessionId } = await request.json()

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Agent ID et message requis' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Get agent
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 })
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', agent.user_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Check rate limit
    if (!checkRateLimit(profile.message_count, profile.message_limit)) {
      return NextResponse.json(
        { error: 'Limite de messages atteinte. Passez à Pro pour des messages illimités.' },
        { status: 429 }
      )
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)

    // Get or create conversation
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const { data: newConversation } = await supabaseAdmin
        .from('conversations')
        .insert({
          agent_id: agentId,
          session_id: sessionId || `session_${Date.now()}`,
        })
        .select()
        .single()

      currentConversationId = newConversation?.id
    }

    // Save user message
    await supabaseAdmin.from('messages').insert({
      conversation_id: currentConversationId,
      agent_id: agentId,
      role: 'user',
      content: sanitizedMessage,
    })

    // Check for AI Actions
    const { data: agentActions } = await supabaseAdmin
      .from('ai_actions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('enabled', true)

    let actionExecuted = false
    let actionResponse = ''

    if (agentActions && agentActions.length > 0) {
      const enabledActionTypes = agentActions.map(a => a.action_type)
      const detectedIntent = detectActionIntent(sanitizedMessage, enabledActionTypes)

      if (detectedIntent) {
        const matchedAction = agentActions.find(a => a.action_type === detectedIntent)

        if (matchedAction) {
          const params = extractActionParams(sanitizedMessage, detectedIntent)

          const actionResult = await executeAction(matchedAction, params, {
            userEmail: profile.email,
            agentId,
            conversationId: currentConversationId,
            userMessage: sanitizedMessage,
          })

          if (actionResult.success) {
            actionExecuted = true
            actionResponse = formatActionResponse(detectedIntent, actionResult)

            // Save action execution to messages
            await supabaseAdmin.from('messages').insert({
              conversation_id: currentConversationId,
              agent_id: agentId,
              role: 'assistant',
              content: actionResponse,
              confidence_score: 100,
              metadata: {
                action_type: detectedIntent,
                action_result: actionResult,
              },
            })

            // Update message count
            await supabaseAdmin
              .from('profiles')
              .update({ message_count: profile.message_count + 1 })
              .eq('id', agent.user_id)

            return NextResponse.json({
              message: actionResponse,
              confidence: 100,
              needsHandover: false,
              conversationId: currentConversationId,
              actionExecuted: true,
              actionType: detectedIntent,
            })
          }
        }
      }
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(sanitizedMessage)

    // Retrieve relevant context from vector store
    const { data: contextChunks } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_agent_id: agentId,
      match_threshold: 0.7,
      match_count: 5,
    })

    // Build context string
    const context = contextChunks && contextChunks.length > 0
      ? contextChunks.map((chunk: any) => chunk.content).join('\n\n')
      : ''

    // Generate response
    const completion = await generateChatCompletion(
      [{ role: 'user', content: sanitizedMessage }],
      context
    )

    const responseText = completion.content || 'Je ne peux pas répondre à cette question.'

    // Calculate confidence score
    const confidenceScore = calculateConfidence(contextChunks || [], responseText)

    // Save assistant message
    await supabaseAdmin.from('messages').insert({
      conversation_id: currentConversationId,
      agent_id: agentId,
      role: 'assistant',
      content: responseText,
      confidence_score: confidenceScore,
    })

    // Update message count
    await supabaseAdmin
      .from('profiles')
      .update({ message_count: profile.message_count + 1 })
      .eq('id', agent.user_id)

    // Check if handover is needed (confidence < 70)
    const needsHandover = confidenceScore < 70

    if (needsHandover) {
      await supabaseAdmin
        .from('conversations')
        .update({ handover_requested: true })
        .eq('id', currentConversationId)
    }

    return NextResponse.json({
      message: responseText,
      confidence: confidenceScore,
      needsHandover,
      conversationId: currentConversationId,
    })

  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    )
  }
}
