import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, username, email, role, approved, active, created_at')
      .order('nome', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, action, value } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    if (action === 'active') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ active: value })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'approved') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ approved: value })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'role') {
      const allowedRoles = ['admin', 'supervisor', 'tecnico', 'testador']

      if (!allowedRoles.includes(String(value))) {
        return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: value })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}