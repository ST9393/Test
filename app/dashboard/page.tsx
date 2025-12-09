import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bot, MessageSquare, TrendingUp, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Fetch user's agents
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false })

  // Fetch conversation stats
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('agent_id', agents?.map(a => a.id) || [])

  // Fetch message stats
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('agent_id', agents?.map(a => a.id) || [])

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session!.user.id)
    .single()

  const isFirstTime = !agents || agents.length === 0

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600 mt-1">
              Bienvenue {profile?.full_name || session!.user.email}
            </p>
          </div>

          <Link href="/dashboard/agents/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Créer un agent
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <Bot className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversationCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Messages ce mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.message_count || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                sur {profile?.message_limit || 100} autorisés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <Zap className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {profile?.subscription_tier || 'free'}
              </div>
              {profile?.subscription_tier === 'free' && (
                <Link href="/dashboard/billing">
                  <Button variant="link" className="p-0 h-auto text-xs">
                    Passer à Pro
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Onboarding for first-time users */}
        {isFirstTime && (
          <Card className="mb-8 border-blue-600 bg-blue-50">
            <CardHeader>
              <CardTitle>Bienvenue sur Builbox !</CardTitle>
              <CardDescription>
                Créez votre premier agent IA en 3 étapes simples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Créer un agent</p>
                    <p className="text-sm text-gray-600">Donnez-lui un nom et une description</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Entraîner avec vos documents</p>
                    <p className="text-sm text-gray-600">Uploadez PDF, URL ou texte - entraînement en 30s</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Tester et intégrer</p>
                    <p className="text-sm text-gray-600">Testez dans le playground puis intégrez le widget sur votre site</p>
                  </div>
                </div>

                <Link href="/dashboard/agents/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer mon premier agent
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Agents */}
        {agents && agents.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Mes agents récents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.slice(0, 6).map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <CardTitle>{agent.name}</CardTitle>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        agent.is_trained
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agent.is_trained ? 'Entraîné' : 'En attente'}
                      </span>

                      {agent.widget_enabled && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          Widget actif
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/agents/${agent.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Modifier
                        </Button>
                      </Link>
                      <Link href={`/dashboard/agents/${agent.id}/playground`} className="flex-1">
                        <Button className="w-full">
                          Tester
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
