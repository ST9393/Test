'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
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
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.\n\nTapez "SUPPRIMER" pour confirmer.'
    )

    if (confirmation !== 'SUPPRIMER') {
      return
    }

    setDeleting(true)

    try {
      // Delete all user data (RGPD compliance)
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast({
        title: 'Compte supprimé',
        description: 'Toutes vos données ont été supprimées',
      })

      // Sign out
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium">{profile?.full_name || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium capitalize">{profile?.subscription_tier || 'free'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RGPD Compliance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Confidentialité & RGPD</CardTitle>
            <CardDescription>
              Vos données sont hébergées en Europe (conformément au RGPD)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Données protégées</p>
                  <p className="text-sm text-green-800">
                    Vos données sont stockées de manière sécurisée sur des serveurs EU (France/Allemagne).
                    Vous avez le droit d'accéder, modifier et supprimer vos données à tout moment.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Consentement RGPD accordé le : {new Date(profile?.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Zone de danger</CardTitle>
            <CardDescription>
              Actions irréversibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  La suppression de votre compte supprimera définitivement toutes vos données :
                  agents, conversations, documents et paramètres. Cette action est irréversible.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Suppression...' : 'Supprimer mon compte'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
