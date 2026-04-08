import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import HodometroTotalChart from './HodometroTotalChart'
import HodometroMensalChart from './HodometroMensalChart'

// Garante que o dashboard busque dados novos do banco a cada carregamento
export const revalidate = 0

type Vehicle = {
  id: string
  placa: string
  modelo: string | null
  ativo: boolean | null
  is_active: boolean | null
}

type Profile = {
  id: string
  nome: string
  username: string
  role: 'admin' | 'supervisor' | 'tecnico'
  approved: boolean
  active: boolean
}

type Inspection = {
  id: string
  inspection_date: string
  vehicle_id: string
  odometer: number | null
  created_at: string
}

type NotificationItem = {
  id: string
  title: string
  description: string
  href: string
  tone: 'red' | 'orange' | 'purple' | 'blue'
}

type VehicleMileage = {
  vehicle_id: string
  placa: string
  modelo: string | null
  first_odometer: number
  last_odometer: number
  km_rodado: number
}

type VehicleCurrentOdometer = {
  vehicle_id: string
  placa: string
  modelo: string | null
  odometer: number
  inspection_date: string
}

function isVehicleActive(vehicle: Vehicle) {
  return vehicle.ativo === true || vehicle.is_active === true
}

function getDaysDifference(dateString: string) {
  const target = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default async function GestorHomePage() {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [vehiclesRes, inspectionsRes, pendingTechsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, placa, modelo, ativo, is_active')
      .order('created_at', { ascending: false }),

    supabase
      .from('inspections')
      .select('id, inspection_date, vehicle_id, odometer, created_at')
      .order('inspection_date', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('id, nome, username, role, approved, active')
      .eq('role', 'tecnico')
      .eq('approved', false)
      .order('nome', { ascending: true }),
  ])

  const vehicles = (vehiclesRes.data || []) as Vehicle[]
  const inspections = (inspectionsRes.data || []) as Inspection[]
  const pendingTechs = (pendingTechsRes.data || []) as Profile[]

  const vehiclesAtivosList = vehicles.filter((v) => isVehicleActive(v))
  const totalVeiculos = vehicles.length
  const veiculosAtivos = vehiclesAtivosList.length

  const activeVehicleIds = new Set(vehiclesAtivosList.map(v => v.id))
  const inspecoesMes = inspections.filter(
    (ins) => new Date(ins.inspection_date) >= new Date(inicioMes) && activeVehicleIds.has(ins.vehicle_id)
  ).length

  const latestInspectionByVehicle = new Map<string, Inspection>()
  for (const inspection of inspections) {
    if (!latestInspectionByVehicle.has(inspection.vehicle_id)) {
      latestInspectionByVehicle.set(inspection.vehicle_id, inspection)
    }
  }

  const veiculosSemInspecao = vehiclesAtivosList.filter(
    (vehicle) => !latestInspectionByVehicle.has(vehicle.id)
  )

  const veiculosInspecaoAtrasada = vehiclesAtivosList.filter((vehicle) => {
    const latestInspection = latestInspectionByVehicle.get(vehicle.id)
    if (!latestInspection) return false
    return getDaysDifference(latestInspection.inspection_date) > 30
  })

  const totalAlertas = veiculosSemInspecao.length + veiculosInspecaoAtrasada.length + pendingTechs.length

  const notificationItems: NotificationItem[] = [
    ...veiculosSemInspecao.slice(0, 4).map((vehicle) => ({
      id: `notif-sem-inspecao-${vehicle.id}`,
      title: `${vehicle.placa} sem inspeção`,
      description: vehicle.modelo || 'Veículo sem histórico',
      href: `/gestor/veiculos/${vehicle.id}`,
      tone: 'red' as const,
    })),
    ...veiculosInspecaoAtrasada.slice(0, 4).map((vehicle) => {
      const dias = getDaysDifference(latestInspectionByVehicle.get(vehicle.id)!.inspection_date)
      return {
        id: `notif-atrasada-${vehicle.id}`,
        title: `${vehicle.placa} atrasada`,
        description: `Última há ${dias} dias`,
        href: `/gestor/veiculos/${vehicle.id}`,
        tone: 'orange' as const,
      }
    }),
    ...pendingTechs.slice(0, 3).map((user) => ({
      id: `notif-aprovacao-${user.id}`,
      title: `${user.nome} aguardando`,
      description: user.username,
      href: '/gestor/aprovacoes',
      tone: 'purple' as const,
    })),
  ].slice(0, 8)

  const currentOdometerRanking: VehicleCurrentOdometer[] = vehiclesAtivosList
    .map((vehicle) => {
      const latest = inspections.find(
        (ins) => ins.vehicle_id === vehicle.id && ins.odometer !== null
      )
      if (!latest) return null
      return {
        vehicle_id: vehicle.id,
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        odometer: latest.odometer || 0,
        inspection_date: latest.inspection_date,
      }
    })
    .filter((item): item is VehicleCurrentOdometer => item !== null)
    .sort((a, b) => b.odometer - a.odometer)

  const chartTotalData = currentOdometerRanking.slice(0, 8)

  const vehicleMileageRanking: VehicleMileage[] = vehiclesAtivosList
    .map((vehicle) => {
      const list = inspections.filter(ins => 
        ins.vehicle_id === vehicle.id && 
        new Date(ins.inspection_date) >= new Date(inicioMes) &&
        ins.odometer !== null
      ).sort((a,b) => new Date(a.inspection_date).getTime() - new Date(b.inspection_date).getTime())

      if (list.length < 2) return null
      const first = list[0].odometer || 0
      const last = list[list.length - 1].odometer || 0
      return {
        vehicle_id: vehicle.id,
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        first_odometer: first,
        last_odometer: last,
        km_rodado: Math.max(0, last - first),
      }
    })
    .filter((item): item is VehicleMileage => item !== null)
    .sort((a, b) => b.km_rodado - a.km_rodado)

  const chartMonthlyData = vehicleMileageRanking.slice(0, 8).map(v => ({
    vehicle_id: v.vehicle_id,
    placa: v.placa,
    modelo: v.modelo,
    km_rodado: v.km_rodado
  }))

  return (
    <div className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Painel do gestor</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-800">Visão geral da operação</h1>
            </div>
            <div className="flex items-center gap-3">
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#2f6eea]">
                  🔔 Notificações 
                  <span className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${totalAlertas > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {totalAlertas}
                  </span>
                </summary>
                <div className="absolute right-0 z-30 mt-3 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
                    {notificationItems.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">Nenhuma notificação.</div>
                    ) : (
                      notificationItems.map(item => (
                        <Link key={item.id} href={item.href} className={`block rounded-lg border p-3 ${item.tone === 'red' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-600">{item.description}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </details>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md bg-[#35c6cf] p-4 text-white">
                <p className="text-xs font-semibold uppercase opacity-80">Veículos</p>
                <p className="mt-2 text-3xl font-bold">{totalVeiculos}</p>
              </div>
              <div className="rounded-md bg-[#38a96a] p-4 text-white">
                <p className="text-xs font-semibold uppercase opacity-80">Ativos</p>
                <p className="mt-2 text-3xl font-bold">{veiculosAtivos}</p>
              </div>
              <div className="rounded-md bg-[#6b63b5] p-4 text-white">
                <p className="text-xs font-semibold uppercase opacity-80">Inspeções/Mês</p>
                <p className="mt-2 text-3xl font-bold">{inspecoesMes}</p>
              </div>
              <div className="rounded-md bg-[#f0ad4e] p-4 text-white">
                <p className="text-xs font-semibold uppercase opacity-80">Alertas</p>
                <p className="mt-2 text-3xl font-bold">{totalAlertas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Hodômetro total</h2>
            <p className="text-sm text-slate-500 mb-4">Ranking por quilometragem atual.</p>
            <HodometroTotalChart data={chartTotalData} />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Rodado no mês</h2>
            <p className="text-sm text-slate-500 mb-4">Uso do veículo no mês vigente.</p>
            <HodometroMensalChart data={chartMonthlyData} />
          </div>
        </div>
      </div>
    </div>
  )
}