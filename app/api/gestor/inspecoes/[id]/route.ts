import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

// Ajustamos o tipo para refletir que params agora é uma Promise
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // É necessário aguardar a Promise de params ser resolvida
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'ID da inspeção é obrigatório.' }, { status: 400 })
    }

    // Deletamos a inspeção
    const { error } = await supabaseAdmin
      .from('inspections')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}