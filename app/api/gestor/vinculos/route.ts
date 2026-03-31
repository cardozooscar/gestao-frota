import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET() {
  try {
    const [tecnicosResult, vehiclesResult, vinculosResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, nome, username, email')
        .eq('role', 'tecnico')
        .eq('approved', true)
        .order('nome', { ascending: true }),

      supabaseAdmin
        .from('vehicles')
        .select('id, placa, modelo, ativo')
        .order('placa', { ascending: true }),

      supabaseAdmin
        .from('vehicle_assignments')
        .select('id, started_at, ended_at, profile_id, vehicle_id')
        .is('ended_at', null)
        .order('started_at', { ascending: false }),
    ])

    if (tecnicosResult.error) {
      return NextResponse.json({ error: tecnicosResult.error.message }, { status: 500 })
    }

    if (vehiclesResult.error) {
      return NextResponse.json({ error: vehiclesResult.error.message }, { status: 500 })
    }

    if (vinculosResult.error) {
      return NextResponse.json({ error: vinculosResult.error.message }, { status: 500 })
    }

    const tecnicos = tecnicosResult.data || []
    const vehicles = vehiclesResult.data || []
    const activeAssignmentsBase = vinculosResult.data || []

    const tecnicosMap = new Map(tecnicos.map((t) => [t.id, t]))
    const vehiclesMap = new Map(vehicles.map((v) => [v.id, v]))

    const activeAssignments = activeAssignmentsBase.map((item) => ({
      ...item,
      profiles: tecnicosMap.get(item.profile_id) || null,
      vehicles: vehiclesMap.get(item.vehicle_id) || null,
    }))

    return NextResponse.json({
      data: {
        tecnicos,
        vehicles,
        activeAssignments,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profileId, vehicleId } = body

    if (!profileId || !vehicleId) {
      return NextResponse.json({ error: 'profileId e vehicleId são obrigatórios.' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { error: closeTechError } = await supabaseAdmin
      .from('vehicle_assignments')
      .update({ ended_at: now })
      .eq('profile_id', profileId)
      .is('ended_at', null)

    if (closeTechError) {
      return NextResponse.json({ error: closeTechError.message }, { status: 500 })
    }

    const { error: closeVehicleError } = await supabaseAdmin
      .from('vehicle_assignments')
      .update({ ended_at: now })
      .eq('vehicle_id', vehicleId)
      .is('ended_at', null)

    if (closeVehicleError) {
      return NextResponse.json({ error: closeVehicleError.message }, { status: 500 })
    }

    const { error: insertError } = await supabaseAdmin
      .from('vehicle_assignments')
      .insert({
        profile_id: profileId,
        vehicle_id: vehicleId,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}