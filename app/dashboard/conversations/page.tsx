import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTimeFR } from '@/lib/utils'

export default async function ConversationsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user's agents
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', session!.user.id)

  const agentIds = agents?.map(a => a.id) || []

  // Get conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      agents(name),
      messages(content, role, created_at)
    `)
    .in('agent_id', agentIds)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conversations</h1>

        {!conversations || conversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Aucune conversation
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv: any) => (
              <Card key={conv.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{conv.agents?.name || 'Agent'}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {formatDateTimeFR(conv.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {conv.handover_requested && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Transfert demandé
                        </span>
                      )}
                      {conv.satisfaction_rating && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {conv.satisfaction_rating}★
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conv.messages?.slice(0, 5).map((msg: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">
                          {msg.role === 'user' ? 'Visiteur' : 'Agent'}:
                        </span>{' '}
                        <span className="text-gray-600">{msg.content}</span>
                      </div>
                    ))}
                    {conv.messages?.length > 5 && (
                      <p className="text-sm text-gray-500">
                        +{conv.messages.length - 5} messages
                      </p>
                    )}
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
