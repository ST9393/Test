import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bot, LayoutDashboard, MessageSquare, BarChart3, Settings, CreditCard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const handleSignOut = async () => {
    'use server'
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Builbox</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Button>
          </Link>

          <Link href="/dashboard/agents">
            <Button variant="ghost" className="w-full justify-start">
              <Bot className="mr-2 h-4 w-4" />
              Mes Agents
            </Button>
          </Link>

          <Link href="/dashboard/conversations">
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Conversations
            </Button>
          </Link>

          <Link href="/dashboard/analytics">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>

          <Link href="/dashboard/billing">
            <Button variant="ghost" className="w-full justify-start">
              <CreditCard className="mr-2 h-4 w-4" />
              Abonnement
            </Button>
          </Link>

          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">
              {profile?.subscription_tier === 'pro' ? 'Plan Pro' : 'Plan Gratuit'}
            </p>
            <p className="text-xs text-gray-600">
              {profile?.message_count || 0} / {profile?.message_limit || 100} messages
            </p>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            {session.user.email}
          </div>

          <form action={handleSignOut}>
            <Button variant="ghost" className="w-full justify-start" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
