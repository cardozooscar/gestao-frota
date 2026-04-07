import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await context.params
    const body = await req.json().catch(() => ({}))
    const action = body?.action || 'deactivate'

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'ID do veículo não informado.' },
        { status: 400 }
      )
    }

    if (action === 'reactivate') {
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update({
          is_active: true,
          deleted_at: null,
          ativo: true,
        })
        .eq('id', vehicleId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'reactivate' })
    }

    const { error } = await supabaseAdmin
      .from('vehicles')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        ativo: false,
      })
      .eq('id', vehicleId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'deactivate' })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}