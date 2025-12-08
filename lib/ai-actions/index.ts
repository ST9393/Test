import type { AIAction, ActionResult } from './types'
import { executeCalendlyAction } from './calendly'
import { executeStripeSubscriptionAction } from './stripe-subscription'
import { executeZapierWebhookAction } from './zapier-webhook'

// Main executor that routes to the right action handler
export async function executeAction(
  action: AIAction,
  params: Record<string, any>,
  context: {
    userEmail?: string
    agentId: string
    conversationId: string
    userMessage: string
  }
): Promise<ActionResult> {
  if (!action.enabled) {
    return {
      success: false,
      action_type: action.action_type,
      error: 'Action désactivée',
      message: 'Cette action n\'est pas activée.',
    }
  }

  try {
    switch (action.action_type) {
      case 'calendly':
        return await executeCalendlyAction(action.config as any, params)

      case 'stripe_subscription':
        if (!context.userEmail) {
          return {
            success: false,
            action_type: 'stripe_subscription',
            error: 'Email utilisateur manquant',
            message: 'Je ne peux pas accéder aux informations d\'abonnement sans votre email.',
          }
        }
        return await executeStripeSubscriptionAction(
          action.config as any,
          params,
          context.userEmail
        )

      case 'zapier_webhook':
        return await executeZapierWebhookAction(action.config as any, params, {
          agentId: context.agentId,
          conversationId: context.conversationId,
          userMessage: context.userMessage,
        })

      default:
        return {
          success: false,
          action_type: action.action_type,
          error: 'Type d\'action inconnu',
          message: 'Cette action n\'est pas supportée.',
        }
    }
  } catch (error: any) {
    console.error(`Action execution error [${action.action_type}]:`, error)
    return {
      success: false,
      action_type: action.action_type,
      error: error.message,
      message: 'Une erreur est survenue lors de l\'exécution de l\'action.',
    }
  }
}

export * from './types'
export * from './intent-detection'
