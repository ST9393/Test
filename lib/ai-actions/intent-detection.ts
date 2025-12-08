import { ACTION_INTENTS } from './types'

// Detect if user message matches an action intent
export function detectActionIntent(
  message: string,
  enabledActions: string[]
): string | null {
  const lowerMessage = message.toLowerCase()

  // Check each enabled action type
  for (const actionType of enabledActions) {
    const intents = ACTION_INTENTS[actionType as keyof typeof ACTION_INTENTS]
    if (!intents) continue

    // Check if message contains any of the intent keywords
    for (const intent of intents) {
      if (lowerMessage.includes(intent)) {
        return actionType
      }
    }
  }

  return null
}

// Extract relevant info from message for action execution
export function extractActionParams(message: string, actionType: string): Record<string, any> {
  const lowerMessage = message.toLowerCase()
  const params: Record<string, any> = {}

  switch (actionType) {
    case 'calendly':
      // Try to extract date/time preferences
      const dateMatch = message.match(/(\d{1,2})[\/\-](\d{1,2})/)
      if (dateMatch) {
        params.preferredDate = dateMatch[0]
      }

      // Extract time if mentioned
      const timeMatch = message.match(/(\d{1,2})[h:](\d{2})?/)
      if (timeMatch) {
        params.preferredTime = timeMatch[0]
      }
      break

    case 'zapier_webhook':
      // Extract the full message as context
      params.userMessage = message
      params.timestamp = new Date().toISOString()
      break

    case 'stripe_subscription':
      // Detect if user wants to cancel
      params.wantsToCancel = lowerMessage.includes('annuler') || lowerMessage.includes('résilier')
      break
  }

  return params
}

// Format action response for the user
export function formatActionResponse(actionType: string, result: any): string {
  switch (actionType) {
    case 'calendly':
      if (result.success && result.data?.booking_url) {
        return `J'ai trouvé des créneaux disponibles ! Vous pouvez réserver en cliquant ici : ${result.data.booking_url}\n\nVous serez redirigé vers Calendly pour choisir l'heure qui vous convient le mieux.`
      }
      return "Je peux vous aider à réserver un créneau. Voici le lien de réservation : " + result.data?.event_type_url

    case 'stripe_subscription':
      if (result.success && result.data) {
        const { status, plan, cancel_url } = result.data
        let response = `Votre abonnement actuel :\n`
        response += `• Plan : ${plan}\n`
        response += `• Statut : ${status === 'active' ? 'Actif ✓' : status}\n\n`

        if (cancel_url) {
          response += `Pour gérer ou annuler votre abonnement, cliquez ici : ${cancel_url}`
        }

        return response
      }
      return "Je ne peux pas accéder aux informations de votre abonnement pour le moment."

    case 'zapier_webhook':
      if (result.success) {
        return "✓ Votre demande a été transmise à notre équipe. Nous vous répondrons dans les plus brefs délais !"
      }
      return "Je n'ai pas pu transmettre votre demande. Veuillez réessayer ou nous contacter directement."

    default:
      return result.message || "Action exécutée"
  }
}
