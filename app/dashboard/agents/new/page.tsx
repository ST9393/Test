'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

// Modal Upgrade pour limite d'agents
function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  const handleUpgrade = async () => {
    const response = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await response.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Limite d'agents atteinte</h3>
          <p className="text-gray-600 mb-6">
            Le plan gratuit est limité à 1 agent.
            Passez à Pro pour créer des agents illimités.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Passer à Pro - 19€/mois
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-4 hover:text-gray-800"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewAgentPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Vérifier le plan et le nombre d'agents
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      const { count: agentCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Plan gratuit limité à 1 agent
      if (profile?.subscription_tier !== 'pro' && (agentCount || 0) >= 1) {
        setShowUpgradeModal(true)
        setLoading(false)
        return
      }

      const { data: agent, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name,
          description,
          greeting_message: 'Bonjour ! Comment puis-je vous aider ?',
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Agent créé !',
        description: 'Ajoutez maintenant vos documents pour l\'entraîner',
      })

      router.push(`/dashboard/agents/${agent.id}`)
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

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/agents">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Créer un nouvel agent</CardTitle>
            <CardDescription>
              Créez un agent IA en quelques secondes. Vous pourrez l'entraîner ensuite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAgent} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'agent *</Label>
                <Input
                  id="name"
                  placeholder="Support Client"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Un nom court et descriptif pour votre agent
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Répond aux questions sur nos produits"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Création...' : 'Créer l\'agent'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
