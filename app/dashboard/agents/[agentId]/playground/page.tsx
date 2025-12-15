'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Send, Loader2, AlertCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { generateSessionId } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  confidence?: number
}

// Modal Upgrade
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
          <h3 className="text-lg font-semibold mb-2">Limite de messages atteinte</h3>
          <p className="text-gray-600 mb-6">
            Vous avez utilisé vos 100 messages gratuits ce mois-ci.
            Passez à Pro pour des messages illimités.
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

export default function PlaygroundPage({ params }: { params: { agentId: string } }) {
  const [agent, setAgent] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionId] = useState(generateSessionId())
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchAgent()
  }, [params.agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAgent = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.agentId)
      .single()

    if (error || !data) {
      toast({
        title: 'Erreur',
        description: 'Agent non trouvé',
        variant: 'destructive',
      })
      router.push('/dashboard/agents')
      return
    }

    setAgent(data)

    // Add greeting message
    if (data.greeting_message) {
      setMessages([{
        role: 'assistant',
        content: data.greeting_message,
      }])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: params.agentId,
          message: userMessage,
          conversationId,
          sessionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setShowUpgradeModal(true)
          return
        }
        throw new Error(data.error || 'Erreur')
      }

      setConversationId(data.conversationId)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        confidence: data.confidence,
      }])

      if (data.needsHandover) {
        toast({
          title: 'Transfert suggéré',
          description: 'L\'agent suggère de transférer vers un humain (confiance < 70%)',
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!agent) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/dashboard/agents/${agent.id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Playground - {agent.name}</CardTitle>
            <p className="text-sm text-gray-500">
              Testez votre agent IA en temps réel
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!agent.is_trained && (
                <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Agent non entraîné</p>
                    <p className="text-sm text-yellow-800">
                      Ajoutez des documents pour entraîner votre agent
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && msg.confidence !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              msg.confidence >= 70
                                ? 'bg-green-500'
                                : msg.confidence >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${msg.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {msg.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={loading}
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
