import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const login = String(body?.login || '').trim().toLowerCase()

    if (!login) {
      return NextResponse.json(
        { error: 'Login não informado.' },
        { status: 400 }
      )
    }

    if (login.includes('@')) {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, approved, active, username')
        .eq('email', login)
        .maybeSingle()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      if (!profile) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          email: profile.email,
          role: profile.role,
          approved: profile.approved,
          active: profile.active ?? true,
          username: profile.username,
        },
      })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, approved, active, username')
      .eq('username', login)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        email: profile.email,
        role: profile.role,
        approved: profile.approved,
        active: profile.active ?? true,
        username: profile.username,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro interno.' },
      { status: 500 }
    )
  }
}