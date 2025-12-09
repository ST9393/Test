import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'

export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createSupabaseAdmin()
    const userId = session.user.id

    // Delete all user data (RGPD compliance)
    // The cascading deletes in the database schema will handle related records

    // Delete user's agents (this will cascade to documents, embeddings, conversations, messages, ai_actions, analytics)
    await supabaseAdmin
      .from('agents')
      .delete()
      .eq('user_id', userId)

    // Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(userId)

    return NextResponse.json({ message: 'Compte supprimé avec succès' })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
