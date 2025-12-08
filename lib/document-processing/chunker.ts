// Chunk text into smaller pieces for embedding
// Target: 512 tokens (~2000 characters) per chunk with overlap

export interface TextChunk {
  content: string
  metadata: {
    chunkIndex: number
    totalChunks: number
    startPos: number
    endPos: number
  }
}

const CHUNK_SIZE = 2000 // ~512 tokens
const CHUNK_OVERLAP = 200 // Overlap to maintain context

export function chunkText(text: string, documentName: string): TextChunk[] {
  // Clean and normalize text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanedText.length === 0) {
    return []
  }

  const chunks: TextChunk[] = []
  let startPos = 0

  while (startPos < cleanedText.length) {
    let endPos = startPos + CHUNK_SIZE

    // If not at the end, try to break at sentence or word boundary
    if (endPos < cleanedText.length) {
      // Look for sentence end
      const sentenceEnd = cleanedText.lastIndexOf('.', endPos)
      const questionEnd = cleanedText.lastIndexOf('?', endPos)
      const exclamationEnd = cleanedText.lastIndexOf('!', endPos)

      const maxEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd)

      if (maxEnd > startPos + CHUNK_SIZE / 2) {
        endPos = maxEnd + 1
      } else {
        // Fall back to word boundary
        const spacePos = cleanedText.lastIndexOf(' ', endPos)
        if (spacePos > startPos + CHUNK_SIZE / 2) {
          endPos = spacePos
        }
      }
    }

    const content = cleanedText.slice(startPos, endPos).trim()

    if (content.length > 0) {
      chunks.push({
        content,
        metadata: {
          chunkIndex: chunks.length,
          totalChunks: 0, // Will be updated after all chunks are created
          startPos,
          endPos,
        },
      })
    }

    // Move start position with overlap
    startPos = endPos - CHUNK_OVERLAP

    // Ensure we make progress
    if (startPos <= chunks[chunks.length - 1]?.metadata.startPos) {
      startPos = endPos
    }
  }

  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length
  })

  return chunks
}

// Smart chunking that preserves document structure
export function smartChunkText(text: string, documentName: string): TextChunk[] {
  // Try to split by headers/sections first
  const sections = text.split(/\n(?=[A-Z][^\n]{0,100}:|\#{1,6}\s|[\d]+\.)/g)

  const allChunks: TextChunk[] = []
  let globalStartPos = 0

  sections.forEach(section => {
    const sectionChunks = chunkText(section, documentName)

    sectionChunks.forEach(chunk => {
      allChunks.push({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          startPos: globalStartPos + chunk.metadata.startPos,
          endPos: globalStartPos + chunk.metadata.endPos,
        },
      })
    })

    globalStartPos += section.length
  })

  // Update indices
  allChunks.forEach((chunk, idx) => {
    chunk.metadata.chunkIndex = idx
    chunk.metadata.totalChunks = allChunks.length
  })

  return allChunks
}
