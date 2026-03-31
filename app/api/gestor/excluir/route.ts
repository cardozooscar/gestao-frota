import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profileId } = body

    if (!profileId) {
      return NextResponse.json({ error: 'profileId é obrigatório' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message }, { status: 500 })
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(profileId)

    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}