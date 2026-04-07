import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

function normalizeUsername(nome: string) {
  const base = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)[0]

  return `${base}.tecnico`
}

async function generateAvailableUsername(nome: string) {
  const base = normalizeUsername(nome)

  const { data: existing, error } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .ilike('username', `${base}%`)

  if (error) {
    throw new Error(error.message)
  }

  if (!existing || existing.length === 0) {
    return base
  }

  const usernames = new Set(existing.map((item) => item.username))

  if (!usernames.has(base)) {
    return base
  }

  let counter = 2
  while (usernames.has(`${base}${counter}`)) {
    counter++
  }

  return `${base}${counter}`
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, username, email, role, approved, active, created_at')
      .eq('role', 'tecnico')
      .order('nome', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao listar técnicos.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nome = String(body?.nome || '').trim()
    const senha = String(body?.senha || '').trim()

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório.' },
        { status: 400 }
      )
    }

    if (!senha || senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const username = await generateAvailableUsername(nome)
    const email = `${username}@frota.local`

    const { data: createdUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      })

    if (authError || !createdUser.user) {
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário no Auth.' },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: createdUser.user.id,
        nome,
        username,
        email,
        role: 'tecnico',
        approved: true,
        active: true,
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id)

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: createdUser.user.id,
        nome,
        username,
        email,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao cadastrar técnico.' },
      { status: 500 }
    )
  }
}