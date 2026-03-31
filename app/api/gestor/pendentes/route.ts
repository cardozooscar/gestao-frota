import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, username, email, role, approved, created_at')
      .eq('role', 'tecnico')
      .eq('approved', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}