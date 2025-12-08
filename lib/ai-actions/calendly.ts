import type { CalendlyConfig, ActionResult } from './types'

// Execute Calendly booking action
export async function executeCalendlyAction(
  config: CalendlyConfig,
  params: Record<string, any>
): Promise<ActionResult> {
  try {
    // For MVP, we just return the Calendly booking URL
    // In production, you could use Calendly API to fetch available slots

    const bookingUrl = config.event_type_url

    if (!bookingUrl) {
      return {
        success: false,
        action_type: 'calendly',
        error: 'URL Calendly non configurée',
        message: 'La réservation Calendly n\'est pas configurée correctement.',
      }
    }

    // Optional: Add parameters to URL
    let finalUrl = bookingUrl
    if (params.preferredDate || params.preferredTime) {
      const urlParams = new URLSearchParams()
      if (params.preferredDate) urlParams.append('date', params.preferredDate)
      if (params.preferredTime) urlParams.append('time', params.preferredTime)
      finalUrl += `?${urlParams.toString()}`
    }

    return {
      success: true,
      action_type: 'calendly',
      data: {
        booking_url: finalUrl,
        event_type_url: config.event_type_url,
      },
      message: 'Lien de réservation Calendly généré',
    }
  } catch (error: any) {
    console.error('Calendly action error:', error)
    return {
      success: false,
      action_type: 'calendly',
      error: error.message,
      message: 'Erreur lors de la génération du lien Calendly',
    }
  }
}

// Advanced: Fetch available slots from Calendly API
export async function fetchCalendlySlots(config: CalendlyConfig): Promise<any[]> {
  if (!config.api_key) {
    throw new Error('API key Calendly manquante')
  }

  // This would call Calendly API to get available event types and slots
  // https://developer.calendly.com/api-docs

  try {
    const response = await fetch('https://api.calendly.com/event_types', {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur API Calendly')
    }

    const data = await response.json()
    return data.collection || []
  } catch (error) {
    console.error('Error fetching Calendly slots:', error)
    return []
  }
}
