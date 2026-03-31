import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const vehicleId = req.nextUrl.searchParams.get('vehicleId')

    let query = supabaseAdmin
      .from('vehicle_maintenance')
      .select(`
        *,
        profiles:profile_id (
          nome,
          email
        )
      `)
      .order('maintenance_date', { ascending: false })

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }

    const { data, error } = await query

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
    const { vehicleId, profileId, maintenanceDate, maintenanceType, description } = body

    if (!vehicleId || !maintenanceDate || !maintenanceType) {
      return NextResponse.json(
        { error: 'vehicleId, maintenanceDate e maintenanceType são obrigatórios.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('vehicle_maintenance')
      .insert({
        vehicle_id: vehicleId,
        profile_id: profileId || null,
        maintenance_date: maintenanceDate,
        maintenance_type: maintenanceType,
        description: description || null,
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