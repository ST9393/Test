'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewAgentPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [greetingMessage, setGreetingMessage] = useState('Bonjour ! Comment puis-je vous aider aujourd\'hui ?')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Non authentifié')

      const { data: agent, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name,
          description,
          greeting_message: greetingMessage,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Agent créé !',
        description: 'Vous pouvez maintenant l\'entraîner avec vos documents',
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
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Agent de support pour répondre aux questions fréquentes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Optionnel - décrivez le rôle de cet agent
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="greeting">Message d'accueil</Label>
                <Input
                  id="greeting"
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Premier message que verra l'utilisateur
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Création...' : 'Créer l\'agent'}
                </Button>
                <Link href="/dashboard/agents">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
