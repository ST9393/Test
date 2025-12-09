import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Users, Clock } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user's agents
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name')
    .eq('user_id', session!.user.id)

  const agentIds = agents?.map(a => a.id) || []

  // Get conversation stats
  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('agent_id', agentIds)

  // Get message stats
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('agent_id', agentIds)

  // Get handover requests
  const { count: handoverRequests } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('agent_id', agentIds)
    .eq('handover_requested', true)

  // Get recent conversations with messages
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select(`
      *,
      agents(name),
      messages(content, role, confidence_score, created_at)
    `)
    .in('agent_id', agentIds)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate average confidence
  const { data: avgConfidenceData } = await supabase
    .from('messages')
    .select('confidence_score')
    .in('agent_id', agentIds)
    .eq('role', 'assistant')
    .not('confidence_score', 'is', null)

  const avgConfidence = avgConfidenceData && avgConfidenceData.length > 0
    ? avgConfidenceData.reduce((sum, msg) => sum + (msg.confidence_score || 0), 0) / avgConfidenceData.length
    : 0

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversations totales</CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Messages envoyés</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Confiance moyenne</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgConfidence)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transferts humains</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{handoverRequests || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentConversations || recentConversations.length === 0 ? (
              <p className="text-gray-500">Aucune conversation</p>
            ) : (
              <div className="space-y-4">
                {recentConversations.map((conv: any) => (
                  <div key={conv.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{conv.agents?.name || 'Agent'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(conv.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {conv.handover_requested && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Transfert demandé
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mt-3">
                      {conv.messages?.slice(0, 3).map((msg: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">
                            {msg.role === 'user' ? 'Visiteur' : 'Agent'}:
                          </span>{' '}
                          <span className="text-gray-600">
                            {msg.content.substring(0, 100)}
                            {msg.content.length > 100 ? '...' : ''}
                          </span>
                          {msg.role === 'assistant' && msg.confidence_score && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({msg.confidence_score}% confiance)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
