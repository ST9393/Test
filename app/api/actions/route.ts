import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get all actions for an agent
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID requis' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const { data: actions, error } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ actions: actions || [] })
  } catch (error: any) {
    console.error('Get actions error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Create or update an action
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agentId, actionType, config, enabled = true, name, description } = body

    if (!agentId || !actionType || !config) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Check if action already exists
    const { data: existing } = await supabase
      .from('ai_actions')
      .select('id')
      .eq('agent_id', agentId)
      .eq('action_type', actionType)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('ai_actions')
        .update({
          config,
          enabled,
          name,
          description,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ action: data })
    } else {
      // Create new
      const { data, error } = await supabase
        .from('ai_actions')
        .insert({
          agent_id: agentId,
          action_type: actionType,
          config,
          enabled,
          name,
          description,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ action: data })
    }
  } catch (error: any) {
    console.error('Create/update action error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Delete an action
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const actionId = searchParams.get('actionId')

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID requis' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const { error } = await supabase
      .from('ai_actions')
      .delete()
      .eq('id', actionId)

    if (error) throw error

    return NextResponse.json({ message: 'Action supprimée' })
  } catch (error: any) {
    console.error('Delete action error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
