import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Play } from 'lucide-react'

export default async function AgentsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Agents</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos agents IA
            </p>
          </div>

          <Link href="/dashboard/agents/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel agent
            </Button>
          </Link>
        </div>

        {!agents || agents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucun agent créé</CardTitle>
              <CardDescription>
                Créez votre premier agent IA pour commencer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/agents/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un agent
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      agent.training_status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : agent.training_status === 'training'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.training_status === 'completed' ? 'Entraîné' :
                       agent.training_status === 'training' ? 'En cours...' :
                       'Non entraîné'}
                    </span>

                    {agent.widget_enabled && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        Widget actif
                      </span>
                    )}

                    {agent.remove_branding && (
                      <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                        Sans branding
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/agents/${agent.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="mr-2 h-3 w-3" />
                        Modifier
                      </Button>
                    </Link>
                    <Link href={`/dashboard/agents/${agent.id}/playground`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <Play className="mr-2 h-3 w-3" />
                        Tester
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
