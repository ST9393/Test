import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Generate embeddings for text chunks
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 3072,
  })

  return response.data[0].embedding
}

// Generate chat completion with French system prompt
export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string
) {
  const systemPrompt = context
    ? `Tu es un assistant virtuel français professionnel et serviable. Réponds UNIQUEMENT en français.

CONTEXTE DE LA BASE DE CONNAISSANCES:
${context}

INSTRUCTIONS IMPORTANTES:
- Réponds de manière précise et concise en te basant UNIQUEMENT sur le contexte fourni ci-dessus
- Si la réponse n'est pas dans le contexte, dis: "Je n'ai pas cette information dans ma base de connaissances. Je transfère votre demande à un agent humain."
- Sois professionnel, courtois et utilise un ton chaleureux
- Si tu n'es pas sûr à plus de 70% de ta réponse, propose de transférer vers un humain
- Ne jamais inventer d'informations qui ne sont pas dans le contexte`
    : `Tu es un assistant virtuel français professionnel et serviable. Réponds UNIQUEMENT en français de manière courtoise et précise.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  return response.choices[0].message
}

// Calculate confidence score based on context relevance
export function calculateConfidence(
  contextChunks: Array<{ similarity: number }>,
  responseText: string
): number {
  if (contextChunks.length === 0) return 0

  // Average similarity of top chunks
  const avgSimilarity = contextChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / contextChunks.length

  // Check for uncertainty phrases
  const uncertaintyPhrases = [
    'je ne suis pas sûr',
    'je n\'ai pas',
    'je transfère',
    'incertain',
    'peut-être',
  ]

  const hasUncertainty = uncertaintyPhrases.some(phrase =>
    responseText.toLowerCase().includes(phrase)
  )

  if (hasUncertainty) return Math.min(avgSimilarity * 50, 50)

  // Confidence score: 0-100
  return Math.round(avgSimilarity * 100)
}
