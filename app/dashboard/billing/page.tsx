'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Check, Loader2, Zap } from 'lucide-react'

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }

  const handleUpgrade = async () => {
    setUpgrading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
      setUpgrading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      window.location.href = data.url
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Abonnement</h1>

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize">
                  {profile?.subscription_tier === 'pro' ? 'Pro' : 'Gratuit'}
                </p>
                <p className="text-gray-600 mt-1">
                  {profile?.message_count || 0} / {profile?.message_limit || 100} messages utilisés ce mois
                </p>
              </div>

              {profile?.subscription_tier === 'pro' ? (
                <Button onClick={handleManageSubscription}>
                  Gérer l'abonnement
                </Button>
              ) : (
                <Button onClick={handleUpgrade} disabled={upgrading}>
                  {upgrading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Passer à Pro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Comparison */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className={profile?.subscription_tier === 'free' ? 'border-2 border-blue-600' : ''}>
            <CardHeader>
              <CardTitle className="text-2xl">Gratuit</CardTitle>
              <div className="text-4xl font-bold">0€<span className="text-lg font-normal text-gray-500">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>100 messages/mois</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>1 agent IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Entraînement sur docs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Widget intégrable</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Logo Builbox</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className={profile?.subscription_tier === 'pro' ? 'border-2 border-blue-600' : ''}>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-4xl font-bold">19€<span className="text-lg font-normal text-gray-500">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span><strong>Messages illimités</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span><strong>Agents illimités</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span><strong>Sans logo Builbox</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>AI Actions (Calendly, Zapier)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Analytics avancées</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Support prioritaire</span>
                </li>
              </ul>

              {profile?.subscription_tier !== 'pro' && (
                <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                  {upgrading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Passer à Pro'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
