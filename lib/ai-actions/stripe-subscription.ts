import type { StripeSubscriptionConfig, ActionResult } from './types'
import { stripe } from '@/lib/stripe/client'

// Execute Stripe subscription check/cancel action
export async function executeStripeSubscriptionAction(
  config: StripeSubscriptionConfig,
  params: Record<string, any>,
  userEmail: string
): Promise<ActionResult> {
  try {
    // Use main Stripe account or custom key
    const stripeClient = config.use_main_account
      ? stripe
      : require('stripe')(config.custom_secret_key)

    // Find customer by email
    const customers = await stripeClient.customers.list({
      email: userEmail,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return {
        success: false,
        action_type: 'stripe_subscription',
        error: 'Aucun abonnement trouvé',
        message: 'Aucun abonnement n\'a été trouvé pour votre email.',
      }
    }

    const customer = customers.data[0]

    // Get active subscriptions
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return {
        success: true,
        action_type: 'stripe_subscription',
        data: {
          status: 'no_subscription',
          plan: 'Aucun abonnement actif',
        },
        message: 'Vous n\'avez pas d\'abonnement actif.',
      }
    }

    const subscription = subscriptions.data[0]
    const plan = subscription.items.data[0]?.price.nickname ||
                 subscription.items.data[0]?.price.product?.toString() ||
                 'Abonnement'

    // Create customer portal session for management
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: customer.id,
      return_url: process.env.NEXT_PUBLIC_APP_URL || 'https://builbox.fr',
    })

    return {
      success: true,
      action_type: 'stripe_subscription',
      data: {
        status: subscription.status,
        plan: plan,
        cancel_url: portalSession.url,
        current_period_end: new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR'),
      },
      message: 'Informations d\'abonnement récupérées',
    }
  } catch (error: any) {
    console.error('Stripe subscription action error:', error)
    return {
      success: false,
      action_type: 'stripe_subscription',
      error: error.message,
      message: 'Erreur lors de la récupération des informations d\'abonnement',
    }
  }
}
