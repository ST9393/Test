import pdf from 'pdf-parse'

// Parse PDF file to text
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Échec de l\'analyse du PDF')
  }
}

// Fetch and parse URL content
export async function parseURL(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    // Basic HTML to text conversion
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()

    return text
  } catch (error) {
    console.error('Error fetching URL:', error)
    throw new Error('Échec de la récupération de l\'URL')
  }
}

// Parse plain text
export function parseText(text: string): string {
  return text.trim()
}

// Validate document content
export function validateDocumentContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false
  }

  // Minimum content length (100 characters)
  if (content.length < 100) {
    return false
  }

  return true
}
