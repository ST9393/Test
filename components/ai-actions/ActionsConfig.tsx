'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, CreditCard, Zap, Save, Loader2 } from 'lucide-react'

interface ActionsConfigProps {
  agentId: string
}

export function ActionsConfig({ agentId }: ActionsConfigProps) {
  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()

  // Calendly config
  const [calendlyEnabled, setCalendlyEnabled] = useState(false)
  const [calendlyApiKey, setCalendlyApiKey] = useState('')
  const [calendlyEventUrl, setCalendlyEventUrl] = useState('')

  // Stripe config
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [stripeUseMain, setStripeUseMain] = useState(true)
  const [stripeCustomKey, setStripeCustomKey] = useState('')

  // Zapier config
  const [zapierEnabled, setZapierEnabled] = useState(false)
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('')

  useEffect(() => {
    fetchActions()
  }, [agentId])

  const fetchActions = async () => {
    try {
      const response = await fetch(`/api/actions?agentId=${agentId}`)
      const data = await response.json()

      if (data.actions) {
        setActions(data.actions)

        // Populate form fields
        data.actions.forEach((action: any) => {
          if (action.action_type === 'calendly') {
            setCalendlyEnabled(action.enabled)
            setCalendlyApiKey(action.config.api_key || '')
            setCalendlyEventUrl(action.config.event_type_url || '')
          } else if (action.action_type === 'stripe_subscription') {
            setStripeEnabled(action.enabled)
            setStripeUseMain(action.config.use_main_account ?? true)
            setStripeCustomKey(action.config.custom_secret_key || '')
          } else if (action.action_type === 'zapier_webhook') {
            setZapierEnabled(action.enabled)
            setZapierWebhookUrl(action.config.webhook_url || '')
          }
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveAction = async (actionType: string, config: any, enabled: boolean, name: string, description: string) => {
    setSaving(actionType)

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          actionType,
          config,
          enabled,
          name,
          description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast({
        title: 'Action sauvegardée',
        description: `${name} a été configuré avec succès`,
      })

      fetchActions()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }

  const handleSaveCalendly = () => {
    saveAction(
      'calendly',
      {
        api_key: calendlyApiKey,
        event_type_url: calendlyEventUrl,
      },
      calendlyEnabled,
      'Calendly Booking',
      'Permet aux utilisateurs de réserver des créneaux'
    )
  }

  const handleSaveStripe = () => {
    saveAction(
      'stripe_subscription',
      {
        use_main_account: stripeUseMain,
        custom_secret_key: stripeUseMain ? undefined : stripeCustomKey,
      },
      stripeEnabled,
      'Stripe Subscription',
      'Affiche et gère les abonnements Stripe'
    )
  }

  const handleSaveZapier = () => {
    saveAction(
      'zapier_webhook',
      {
        webhook_url: zapierWebhookUrl,
      },
      zapierEnabled,
      'Zapier Webhook',
      'Envoie les demandes vers Zapier'
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI Actions</h3>
        <p className="text-sm text-gray-600">
          Configurez des actions automatiques que votre agent peut exécuter.
          L'agent détectera automatiquement l'intention dans les messages et déclenchera l'action appropriée.
        </p>
      </div>

      {/* Calendly Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Calendly Booking</CardTitle>
                <CardDescription>
                  L'agent propose des créneaux de rendez-vous Calendly
                </CardDescription>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={calendlyEnabled}
                onChange={(e) => setCalendlyEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Activé</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="calendly-url">URL de votre événement Calendly *</Label>
            <Input
              id="calendly-url"
              placeholder="https://calendly.com/votre-username/30min"
              value={calendlyEventUrl}
              onChange={(e) => setCalendlyEventUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              L'URL de votre type d'événement Calendly
            </p>
          </div>

          <div>
            <Label htmlFor="calendly-key">API Key Calendly (optionnel)</Label>
            <Input
              id="calendly-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiJ9..."
              value={calendlyApiKey}
              onChange={(e) => setCalendlyApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Pour des fonctionnalités avancées (créer des événements automatiquement)
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Exemples de phrases détectées :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>"Je voudrais prendre rendez-vous"</li>
              <li>"Réserver un créneau"</li>
              <li>"Voir les disponibilités"</li>
            </ul>
          </div>

          <Button
            onClick={handleSaveCalendly}
            disabled={saving === 'calendly' || !calendlyEventUrl}
          >
            {saving === 'calendly' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder Calendly
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stripe Subscription Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle>Stripe Subscription Check</CardTitle>
                <CardDescription>
                  L'agent affiche l'abonnement actuel et permet l'annulation
                </CardDescription>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripeEnabled}
                onChange={(e) => setStripeEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Activé</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripeUseMain}
                onChange={(e) => setStripeUseMain(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Utiliser le compte Stripe principal de Builbox</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Recommandé pour la plupart des cas
            </p>
          </div>

          {!stripeUseMain && (
            <div>
              <Label htmlFor="stripe-key">Clé secrète Stripe personnalisée</Label>
              <Input
                id="stripe-key"
                type="password"
                placeholder="sk_live_..."
                value={stripeCustomKey}
                onChange={(e) => setStripeCustomKey(e.target.value)}
              />
            </div>
          )}

          <div className="bg-purple-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Exemples de phrases détectées :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>"Mon abonnement actuel"</li>
              <li>"Je veux annuler"</li>
              <li>"Ma souscription"</li>
            </ul>
          </div>

          <Button
            onClick={handleSaveStripe}
            disabled={saving === 'stripe_subscription' || (!stripeUseMain && !stripeCustomKey)}
          >
            {saving === 'stripe_subscription' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder Stripe
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Zapier Webhook Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle>Zapier Webhook</CardTitle>
                <CardDescription>
                  Envoie les demandes vers Zapier pour traitement
                </CardDescription>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={zapierEnabled}
                onChange={(e) => setZapierEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Activé</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="zapier-url">URL du webhook Zapier *</Label>
            <Input
              id="zapier-url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={zapierWebhookUrl}
              onChange={(e) => setZapierWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Créez un Zap avec trigger "Webhook" et copiez l'URL ici
            </p>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Exemples de phrases détectées :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>"Créer un ticket"</li>
              <li>"Contacter le support"</li>
              <li>"Envoyer une demande"</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Données envoyées :</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "timestamp": "2024-01-01T12:00:00Z",
  "agent_id": "xxx",
  "conversation_id": "xxx",
  "user_message": "...",
  "source": "builbox"
}`}
            </pre>
          </div>

          <Button
            onClick={handleSaveZapier}
            disabled={saving === 'zapier_webhook' || !zapierWebhookUrl}
          >
            {saving === 'zapier_webhook' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder Zapier
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
