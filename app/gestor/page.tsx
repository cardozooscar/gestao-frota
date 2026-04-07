import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import HodometroTotalChart from './HodometroTotalChart'
import HodometroMensalChart from './HodometroMensalChart'

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
  if (typeof vehicle.is_active === 'boolean') return vehicle.is_active
  if (typeof vehicle.ativo === 'boolean') return vehicle.ativo
  return false
}

function getDaysDifference(dateString: string) {
  const target = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default async function GestorHomePage() {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)

  const [vehiclesRes, inspectionsRes, pendingTechsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, placa, modelo, ativo, is_active')
      .order('created_at', { ascending: false }),

    supabase
      .from('inspections')
      .select('id, inspection_date, vehicle_id, odometer')
      .order('inspection_date', { ascending: false }),

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

  const inspecoesMes = inspections.filter(
    (inspection) => new Date(inspection.inspection_date) >= inicioMes
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

  const totalAlertas =
    veiculosSemInspecao.length +
    veiculosInspecaoAtrasada.length +
    pendingTechs.length

  const notificationItems: NotificationItem[] = [
    ...veiculosSemInspecao.slice(0, 4).map((vehicle) => ({
      id: `notif-sem-inspecao-${vehicle.id}`,
      title: `${vehicle.placa} sem inspeção`,
      description: vehicle.modelo || 'Veículo sem histórico de inspeção',
      href: `/gestor/veiculos/${vehicle.id}`,
      tone: 'red' as const,
    })),
    ...veiculosInspecaoAtrasada.slice(0, 4).map((vehicle) => {
      const latestInspection = latestInspectionByVehicle.get(vehicle.id)!
      const dias = getDaysDifference(latestInspection.inspection_date)

      return {
        id: `notif-atrasada-${vehicle.id}`,
        title: `${vehicle.placa} com inspeção atrasada`,
        description: `Última inspeção há ${dias} dia(s)`,
        href: `/gestor/veiculos/${vehicle.id}`,
        tone: 'orange' as const,
      }
    }),
    ...pendingTechs.slice(0, 3).map((user) => ({
      id: `notif-aprovacao-${user.id}`,
      title: `${user.nome} aguardando aprovação`,
      description: user.username,
      href: '/gestor/aprovacoes',
      tone: 'purple' as const,
    })),
  ].slice(0, 8)

  const currentOdometerRanking: VehicleCurrentOdometer[] = vehiclesAtivosList
    .map((vehicle) => {
      const latestInspection = inspections.find(
        (inspection) =>
          inspection.vehicle_id === vehicle.id && inspection.odometer !== null
      )

      if (!latestInspection || latestInspection.odometer === null) return null

      return {
        vehicle_id: vehicle.id,
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        odometer: latestInspection.odometer,
        inspection_date: latestInspection.inspection_date,
      }
    })
    .filter((item): item is VehicleCurrentOdometer => item !== null)
    .sort((a, b) => b.odometer - a.odometer)

  const chartTotalData = currentOdometerRanking.slice(0, 8).map((item) => ({
    vehicle_id: item.vehicle_id,
    placa: item.placa,
    modelo: item.modelo,
    odometer: item.odometer,
  }))

  const inspectionsMes = inspections.filter(
    (inspection) => new Date(inspection.inspection_date) >= inicioMes
  )

  const inspectionsByVehicle = new Map<string, Inspection[]>()

  for (const inspection of inspectionsMes) {
    if (inspection.odometer === null) continue
    const current = inspectionsByVehicle.get(inspection.vehicle_id) || []
    current.push(inspection)
    inspectionsByVehicle.set(inspection.vehicle_id, current)
  }

  const vehicleMileageRanking: VehicleMileage[] = vehiclesAtivosList
    .map((vehicle) => {
      const list = inspectionsByVehicle.get(vehicle.id) || []

      const ordered = [...list].sort(
        (a, b) =>
          new Date(a.inspection_date).getTime() - new Date(b.inspection_date).getTime()
      )

      if (ordered.length < 2) return null
      if (ordered[0].odometer === null || ordered[ordered.length - 1].odometer === null) {
        return null
      }

      const firstOdometer = ordered[0].odometer
      const lastOdometer = ordered[ordered.length - 1].odometer
      const kmRodado = Math.max(0, lastOdometer - firstOdometer)

      return {
        vehicle_id: vehicle.id,
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        first_odometer: firstOdometer,
        last_odometer: lastOdometer,
        km_rodado: kmRodado,
      }
    })
    .filter((item): item is VehicleMileage => item !== null)
    .sort((a, b) => b.km_rodado - a.km_rodado)

  const chartMonthlyData = vehicleMileageRanking.slice(0, 8).map((item) => ({
    vehicle_id: item.vehicle_id,
    placa: item.placa,
    modelo: item.modelo,
    km_rodado: item.km_rodado,
  }))

  return (
    <div className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Painel do gestor
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-800">
                Visão geral da operação
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Indicadores rápidos da frota, inspeções e pendências.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
                Ambiente interno
              </span>

              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#2f6eea] hover:text-[#2f6eea]">
                  <span className="text-base">🔔</span>
                  <span>Notificações</span>
                  <span
                    className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      totalAlertas > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {totalAlertas}
                  </span>
                </summary>

                <div className="absolute right-0 z-30 mt-3 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-800">Notificações</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {notificationItems.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Clique em um alerta para abrir o problema.
                    </p>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto p-3">
                    {notificationItems.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                        Nenhuma notificação no momento.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notificationItems.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`block rounded-lg border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
                              item.tone === 'red'
                                ? 'border-red-200 bg-red-50'
                                : item.tone === 'orange'
                                  ? 'border-amber-200 bg-amber-50'
                                  : item.tone === 'purple'
                                    ? 'border-purple-200 bg-purple-50'
                                    : 'border-blue-200 bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {item.description}
                                </p>
                              </div>

                              <span
                                className={`mt-0.5 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                  item.tone === 'red'
                                    ? 'bg-red-100 text-red-700'
                                    : item.tone === 'orange'
                                      ? 'bg-amber-100 text-amber-700'
                                      : item.tone === 'purple'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                alerta
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                    <Link
                      href="/gestor/veiculos"
                      className="text-sm font-semibold text-[#2f6eea] hover:text-[#214fb1]"
                    >
                      Abrir módulo da frota
                    </Link>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-[#35c6cf] px-4 py-4 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Veículos
                </p>
                <p className="mt-2 text-3xl font-bold">{totalVeiculos}</p>
                <p className="mt-1 text-sm text-white/85">Total cadastrado</p>
              </div>

              <div className="rounded-md border border-slate-200 bg-[#38a96a] px-4 py-4 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Ativos
                </p>
                <p className="mt-2 text-3xl font-bold">{veiculosAtivos}</p>
                <p className="mt-1 text-sm text-white/85">Em operação</p>
              </div>

              <div className="rounded-md border border-slate-200 bg-[#6b63b5] px-4 py-4 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Inspeções
                </p>
                <p className="mt-2 text-3xl font-bold">{inspecoesMes}</p>
                <p className="mt-1 text-sm text-white/85">No mês atual</p>
              </div>

              <div className="rounded-md border border-slate-200 bg-[#f0ad4e] px-4 py-4 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Alertas
                </p>
                <p className="mt-2 text-3xl font-bold">{totalAlertas}</p>
                <p className="mt-1 text-sm text-white/85">Itens que exigem atenção</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">Hodômetro total</h2>
              <p className="mt-1 text-sm text-slate-500">
                Última leitura registrada por veículo.
              </p>
            </div>

            <div className="p-6">
              <HodometroTotalChart data={chartTotalData} />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">Rodado no mês</h2>
              <p className="mt-1 text-sm text-slate-500">
                Diferença entre a primeira e a última leitura do mês atual.
              </p>
            </div>

            <div className="p-6">
              <HodometroMensalChart data={chartMonthlyData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}