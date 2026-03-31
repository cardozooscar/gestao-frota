'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

export default function VehicleDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [vehicle, setVehicle] = useState<any>(null)
  const [inspections, setInspections] = useState<any[]>([])
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [maintenanceType, setMaintenanceType] = useState('')
  const [maintenanceDate, setMaintenanceDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)

    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    const { data: inspectionsData } = await supabase
      .from('inspections')
      .select('*')
      .eq('vehicle_id', id)
      .order('inspection_date', { ascending: false })

    const { data: maintenanceData } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', id)
      .order('maintenance_date', { ascending: false })

    setVehicle(vehicleData)
    setInspections(inspectionsData || [])
    setMaintenances(maintenanceData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function handleAddMaintenance(e: any) {
    e.preventDefault()
    setSaving(true)

    const { data: user } = await supabase.auth.getUser()

    await fetch('/api/gestor/manutencoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: id,
        profileId: user.user?.id,
        maintenanceDate,
        maintenanceType,
        description,
      }),
    })

    setMaintenanceType('')
    setMaintenanceDate('')
    setDescription('')
    setSaving(false)

    loadData()
  }

  function groupByMonth(data: any[], field: string) {
    const groups: any = {}

    data.forEach((item) => {
      const date = new Date(item[field])
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`

      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })

    return groups
  }

  if (loading) return <p className="text-white p-6">Carregando...</p>

  return (
    <main className="min-h-screen bg-[#02052b] text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-[#070b3f] p-6 rounded-xl mb-6">
          <h1 className="text-3xl font-bold">{vehicle?.placa}</h1>
          <p className="text-slate-300">{vehicle?.modelo}</p>
          <p className="text-slate-400 mt-2">
            Tipo: {vehicle?.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
          </p>
        </div>

        {/* MANUTENÇÃO */}
        <div className="bg-[#070b3f] p-6 rounded-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Nova manutenção</h2>

          <form onSubmit={handleAddMaintenance} className="grid gap-4 md:grid-cols-4">
            <input
              type="date"
              value={maintenanceDate}
              onChange={(e) => setMaintenanceDate(e.target.value)}
              className="bg-[#050827] p-3 rounded-lg"
              required
            />

            <select
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
              className="bg-[#050827] p-3 rounded-lg"
              required
            >
              <option value="">Tipo</option>
              <option value="troca_oleo">Troca de óleo</option>
              <option value="pneu">Troca de pneu</option>
              <option value="ar_condicionado">Ar-condicionado</option>
              <option value="revisao">Revisão</option>
            </select>

            <input
              type="text"
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#050827] p-3 rounded-lg"
            />

            <button className="bg-blue-600 rounded-lg font-bold">
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </div>

        {/* HISTÓRICO DE MANUTENÇÃO */}
        <div className="bg-[#070b3f] p-6 rounded-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Histórico de manutenção</h2>

          {maintenances.map((m) => (
            <div key={m.id} className="border-b border-[#1d2466] py-3">
              <p className="font-semibold">{m.maintenance_type}</p>
              <p className="text-sm text-slate-400">{m.maintenance_date}</p>
              <p className="text-slate-300">{m.description}</p>
            </div>
          ))}
        </div>

        {/* INSPEÇÕES */}
        <div className="bg-[#070b3f] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Inspeções</h2>

          {Object.entries(groupByMonth(inspections, 'inspection_date')).map(([mes, items]: any) => (
            <div key={mes} className="mb-6">
              <h3 className="text-lg font-bold text-blue-400 mb-2">{mes}</h3>

              {items.map((i: any) => (
                <div key={i.id} className="bg-[#050827] p-4 rounded-lg mb-2">
                  <p>Data: {i.inspection_date}</p>
                  <p>KM: {i.odometer}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}