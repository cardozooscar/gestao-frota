import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
      .order('placa', { ascending: true })

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
    const { placa, modelo, ownershipType, imageUrl } = body

    if (!placa || !modelo || !ownershipType) {
      return NextResponse.json(
        { error: 'Placa, modelo e tipo são obrigatórios.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .insert({
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        ownership_type: ownershipType,
        image_url: imageUrl?.trim() || null,
        ativo: true,
        is_active: true,
        deleted_at: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}