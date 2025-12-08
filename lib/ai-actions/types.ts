// AI Actions type definitions

export interface CalendlyConfig {
  api_key: string
  event_type_url: string // e.g., https://calendly.com/username/30min
  timezone?: string
}

export interface StripeSubscriptionConfig {
  use_main_account: boolean // If true, use main Stripe account
  custom_secret_key?: string // If provided, use this instead
}

export interface ZapierWebhookConfig {
  webhook_url: string
  custom_headers?: Record<string, string>
}

export type ActionConfig = CalendlyConfig | StripeSubscriptionConfig | ZapierWebhookConfig

export interface AIAction {
  id: string
  agent_id: string
  action_type: 'calendly' | 'stripe_subscription' | 'zapier_webhook'
  name: string
  description: string
  config: ActionConfig
  enabled: boolean
  created_at: string
}

// Intent patterns for action detection
export const ACTION_INTENTS = {
  calendly: [
    'prendre rendez-vous',
    'réserver un créneau',
    'planifier une réunion',
    'fixer un rendez-vous',
    'voir les disponibilités',
    'calendrier',
    'rendez-vous',
  ],
  stripe_subscription: [
    'mon abonnement',
    'ma souscription',
    'annuler',
    'résilier',
    'plan actuel',
    'formule',
    'facturation',
  ],
  zapier_webhook: [
    'créer un ticket',
    'envoyer une demande',
    'contacter le support',
    'transmettre',
    'notifier',
  ],
}

// Action execution results
export interface ActionResult {
  success: boolean
  action_type: string
  data?: any
  error?: string
  message: string // Message to show to user
}
