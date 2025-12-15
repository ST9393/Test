import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json().catch(() => ({}))
    const billingCycle = body.billingCycle || 'annual'

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profile?.subscription_tier === 'pro') {
      return NextResponse.json(
        { error: 'Vous êtes déjà abonné au plan Pro' },
        { status: 400 }
      )
    }

    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email!,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      billingCycle
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
