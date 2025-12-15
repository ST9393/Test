'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Upload, Link as LinkIcon, FileText, Trash2, Loader2, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function AgentPage({ params }: { params: { agentId: string } }) {
  const [agent, setAgent] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Document upload states
  const [urlToAdd, setUrlToAdd] = useState('')
  const [textToAdd, setTextToAdd] = useState('')

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchAgent()
    fetchDocuments()
  }, [params.agentId])

  const fetchAgent = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.agentId)
      .single()

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Agent non trouvé',
        variant: 'destructive',
      })
      router.push('/dashboard/agents')
      return
    }

    setAgent(data)
    setLoading(false)
  }

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('agent_id', params.agentId)
      .order('created_at', { ascending: false })

    setDocuments(data || [])
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Format invalide',
        description: 'Seuls les fichiers PDF sont acceptés',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${params.agentId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          agent_id: params.agentId,
          name: file.name,
          type: 'pdf',
          source_url: publicUrl,
        })

      if (docError) throw docError

      // Trigger training
      await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: params.agentId,
        }),
      })

      toast({
        title: 'Document ajouté',
        description: 'Entraînement en cours (environ 30s)',
      })

      fetchDocuments()
      fetchAgent()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAddUrl = async () => {
    if (!urlToAdd) return

    setUploading(true)

    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          agent_id: params.agentId,
          name: urlToAdd,
          type: 'url',
          source_url: urlToAdd,
        })

      if (error) throw error

      // Trigger training
      await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: params.agentId,
        }),
      })

      toast({
        title: 'URL ajoutée',
        description: 'Entraînement en cours (environ 30s)',
      })

      setUrlToAdd('')
      fetchDocuments()
      fetchAgent()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAddText = async () => {
    if (!textToAdd) return

    setUploading(true)

    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          agent_id: params.agentId,
          name: 'Texte personnalisé',
          type: 'text',
          content: textToAdd,
        })

      if (error) throw error

      // Trigger training
      await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: params.agentId,
        }),
      })

      toast({
        title: 'Texte ajouté',
        description: 'Entraînement en cours (environ 30s)',
      })

      setTextToAdd('')
      fetchDocuments()
      fetchAgent()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      toast({
        title: 'Document supprimé',
      })

      fetchDocuments()
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
        <Link href="/dashboard/agents">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600 mt-1">{agent.description}</p>
          </div>

          <Link href={`/dashboard/agents/${agent.id}/playground`}>
            <Button>Tester l'agent</Button>
          </Link>
        </div>

        <Tabs defaultValue="training">
          <TabsList>
            <TabsTrigger value="training">Entraînement</TabsTrigger>
            <TabsTrigger value="embed">Intégration</TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter des documents</CardTitle>
                <CardDescription>
                  Entraînez votre agent avec vos documents (PDF, URL ou texte)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pdf">
                  <TabsList>
                    <TabsTrigger value="pdf">
                      <Upload className="mr-2 h-4 w-4" />
                      PDF
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="text">
                      <FileText className="mr-2 h-4 w-4" />
                      Texte
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="max-w-xs mx-auto"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Formats acceptés : PDF uniquement
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="url">
                    <div className="space-y-4">
                      <Input
                        placeholder="https://exemple.fr/page"
                        value={urlToAdd}
                        onChange={(e) => setUrlToAdd(e.target.value)}
                      />
                      <Button onClick={handleAddUrl} disabled={uploading}>
                        {uploading ? 'Ajout...' : 'Ajouter URL'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="text">
                    <div className="space-y-4">
                      <textarea
                        className="w-full min-h-[200px] p-3 border rounded-md"
                        placeholder="Collez votre texte ici..."
                        value={textToAdd}
                        onChange={(e) => setTextToAdd(e.target.value)}
                      />
                      <Button onClick={handleAddText} disabled={uploading}>
                        {uploading ? 'Ajout...' : 'Ajouter texte'}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents ({documents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-gray-500">Aucun document ajouté</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type.toUpperCase()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed">
            <Card>
              <CardHeader>
                <CardTitle>Intégrer le widget</CardTitle>
                <CardDescription>
                  Copiez ce code et collez-le avant la balise &lt;/body&gt; de votre site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : 'https://votre-domaine.com'}/widget.js';
    script.setAttribute('data-agent-id', '${agent.id}');
    document.body.appendChild(script);
  })();
</script>`}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const code = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js';
    script.setAttribute('data-agent-id', '${agent.id}');
    document.body.appendChild(script);
  })();
</script>`
                      navigator.clipboard.writeText(code)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
