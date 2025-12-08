import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createSupabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'pro',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            message_limit: 999999, // Unlimited
          })
          .eq('id', session.client_reference_id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
            message_limit: 100,
          })
          .eq('stripe_customer_id', subscription.customer)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any

        const tier = subscription.status === 'active' ? 'pro' : 'free'
        const messageLimit = tier === 'pro' ? 999999 : 100

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: tier,
            message_limit: messageLimit,
          })
          .eq('stripe_customer_id', subscription.customer)

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
