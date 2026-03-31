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

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .ilike('username', `${base}%`)

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
      .select('id, nome, username, email, role, approved, created_at')
      .eq('role', 'tecnico')
      .order('nome', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email } = body

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 })
    }

    const username = await generateAvailableUsername(nome)
    const senhaPadrao = 'Fibranet1020'

    const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaPadrao,
      email_confirm: true,
    })

    if (authError || !createdUser.user) {
      return NextResponse.json(
        { error: authError?.message || 'Não foi possível criar o usuário.' },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: createdUser.user.id,
      nome,
      username,
      email,
      role: 'tecnico',
      approved: true,
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: createdUser.user.id,
        nome,
        email,
        username,
        senhaPadrao,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}