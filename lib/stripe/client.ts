import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Create Stripe checkout session for Pro subscription
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string,
  billingCycle: 'monthly' | 'annual' = 'annual'
) {
  const priceId = billingCycle === 'annual'
    ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!
    : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'fr',
    subscription_data: {
      metadata: {
        userId,
        billingCycle,
      },
    },
  })

  return session
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: 'fr',
  })

  return session
}

// Get subscription status
export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription.status
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}
