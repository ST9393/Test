import type { ZapierWebhookConfig, ActionResult } from './types'

// Execute Zapier webhook action
export async function executeZapierWebhookAction(
  config: ZapierWebhookConfig,
  params: Record<string, any>,
  conversationContext?: {
    agentId: string
    conversationId: string
    userMessage: string
  }
): Promise<ActionResult> {
  try {
    if (!config.webhook_url) {
      return {
        success: false,
        action_type: 'zapier_webhook',
        error: 'URL webhook manquante',
        message: 'Le webhook Zapier n\'est pas configuré.',
      }
    }

    // Prepare payload
    const payload = {
      timestamp: new Date().toISOString(),
      agent_id: conversationContext?.agentId,
      conversation_id: conversationContext?.conversationId,
      user_message: conversationContext?.userMessage || params.userMessage,
      params: params,
      source: 'builbox',
    }

    // Send to Zapier webhook
    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.custom_headers,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`)
    }

    const responseData = await response.json().catch(() => ({}))

    return {
      success: true,
      action_type: 'zapier_webhook',
      data: {
        webhook_response: responseData,
        payload: payload,
      },
      message: 'Demande transmise avec succès',
    }
  } catch (error: any) {
    console.error('Zapier webhook action error:', error)
    return {
      success: false,
      action_type: 'zapier_webhook',
      error: error.message,
      message: 'Erreur lors de la transmission de la demande',
    }
  }
}
