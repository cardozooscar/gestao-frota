'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type Vehicle = {
  id: string
  placa: string
  modelo: string
  ativo: boolean
  created_at?: string
}

type Inspection = {
  id: string
  vehicle_id: string
  inspection_date: string
  odometer: number
  created_at: string
  observation_general: string | null
  motor_observation: string | null
  profiles?: {
    nome: string
    email: string
  } | null
}

type VehicleCard = Vehicle & {
  lastInspection: Inspection | null
}

function formatDate(date?: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatDateTime(date?: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleString('pt-BR')
}

function diffDays(date?: string | null) {
  if (!date) return null
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getVehicleStatus(lastInspection: Inspection | null) {
  if (!lastInspection) {
    return {
      label: 'Sem inspeção',
      badgeClass: 'bg-red-500/15 text-red-300 border border-red-500/30',
      lineClass: 'bg-red-500',
    }
  }

  const days = diffDays(lastInspection.inspection_date)

  if (days !== null && days <= 3) {
    return {
      label: 'Atualizado',
      badgeClass: 'bg-green-500/15 text-green-300 border border-green-500/30',
      lineClass: 'bg-green-500',
    }
  }

  if (days !== null && days <= 7) {
    return {
      label: 'Atenção',
      badgeClass: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
      lineClass: 'bg-yellow-500',
    }
  }

  return {
    label: 'Atrasado',
    badgeClass: 'bg-red-500/15 text-red-300 border border-red-500/30',
    lineClass: 'bg-red-500',
  }
}

export default function GestorPage() {
  const router = useRouter()

  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [pendentes, setPendentes] = useState(0)
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'atualizados' | 'atencao' | 'atrasados' | 'sem-inspecao'>('todos')

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, nome')
        .eq('id', userData.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        router.push('/login')
        return
      }

      setNomeAdmin(profile.nome || 'Administrador')

      const [{ data: vehiclesData }, { data: inspectionsData }, pendentesResponse] =
        await Promise.all([
          supabase.from('vehicles').select('*').order('placa', { ascending: true }),
          supabase
            .from('inspections')
            .select(`
              id,
              vehicle_id,
              inspection_date,
              odometer,
              created_at,
              observation_general,
              motor_observation,
              profiles:profile_id (
                nome,
                email
              )
            `)
            .order('inspection_date', { ascending: false }),
          fetch('/api/gestor/pendentes'),
        ])

      const pendentesResult = await pendentesResponse.json()

      setVeiculos(vehiclesData || [])
      setInspections((inspectionsData as Inspection[]) || [])
      setPendentes(pendentesResult?.data?.length || 0)
      setLoading(false)
    }

    loadData()
  }, [router])

  const vehicleCards = useMemo<VehicleCard[]>(() => {
    const latestInspectionByVehicle = new Map<string, Inspection>()

    for (const inspection of inspections) {
      if (!latestInspectionByVehicle.has(inspection.vehicle_id)) {
        latestInspectionByVehicle.set(inspection.vehicle_id, inspection)
      }
    }

    return veiculos.map((vehicle) => ({
      ...vehicle,
      lastInspection: latestInspectionByVehicle.get(vehicle.id) || null,
    }))
  }, [veiculos, inspections])

  const filteredVehicles = useMemo(() => {
    return vehicleCards.filter((vehicle) => {
      const status = getVehicleStatus(vehicle.lastInspection)

      if (filtro === 'todos') return true
      if (filtro === 'sem-inspecao') return status.label === 'Sem inspeção'
      if (filtro === 'atualizados') return status.label === 'Atualizado'
      if (filtro === 'atencao') return status.label === 'Atenção'
      if (filtro === 'atrasados') return status.label === 'Atrasado'

      return true
    })
  }, [vehicleCards, filtro])

  const totalInspections = inspections.length
  const totalVehicles = veiculos.length
  const totalComInspecao = vehicleCards.filter((v) => v.lastInspection).length
  const totalSemInspecao = vehicleCards.filter((v) => !v.lastInspection).length

  const ultimaAtividade = useMemo(() => {
    if (!inspections.length) return null
    return inspections[0]
  }, [inspections])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#02052b] text-white flex items-center justify-center">
        <p>Carregando painel do gestor...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#02052b] text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-[#070b3f] border border-[#1d2466] rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-[0.28em]">
                Painel do Gestor
              </p>

              <h1 className="text-4xl font-bold mt-2">
                Gestão de Frota
              </h1>

              <p className="text-slate-300 mt-3 max-w-2xl">
                Acompanhe veículos, inspeções, pendências e histórico operacional em um único painel.
              </p>

              <p className="text-slate-500 text-sm mt-4">
                Bem-vindo, {nomeAdmin}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/gestor/tecnicos')}
                className="bg-[#2f6eea] hover:bg-[#255ed0] rounded-xl px-5 py-3 font-bold transition"
              >
                Técnicos
              </button>

              <button
                onClick={() => router.push('/gestor/vinculos')}
                className="bg-[#1d2466] hover:bg-[#28318a] rounded-xl px-5 py-3 font-bold transition"
              >
                Vínculos
              </button>

              <button
                onClick={() => router.push('/gestor/aprovacoes')}
                className="relative bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl px-5 py-3 font-bold transition"
              >
                Aprovações
                {pendentes > 0 && (
                  <span className="ml-3 inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-red-600 text-white text-sm px-2">
                    {pendentes}
                  </span>
                )}
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="bg-red-600 hover:bg-red-700 rounded-xl px-5 py-3 font-semibold transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Veículos cadastrados</p>
            <h2 className="text-4xl font-bold mt-3">{totalVehicles}</h2>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Inspeções registradas</p>
            <h2 className="text-4xl font-bold mt-3">{totalInspections}</h2>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Veículos com histórico</p>
            <h2 className="text-4xl font-bold mt-3 text-green-400">{totalComInspecao}</h2>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Sem inspeção</p>
            <h2 className="text-4xl font-bold mt-3 text-red-400">{totalSemInspecao}</h2>
          </div>
        </div>

        <div className="bg-[#070b3f] border border-[#1d2466] rounded-3xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Visão operacional</h2>
              <p className="text-slate-400 mt-1">
                Filtre rapidamente os veículos conforme a situação atual.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos', label: `Todos (${vehicleCards.length})` },
                {
                  key: 'atualizados',
                  label: `Atualizados (${vehicleCards.filter((v) => getVehicleStatus(v.lastInspection).label === 'Atualizado').length})`,
                },
                {
                  key: 'atencao',
                  label: `Atenção (${vehicleCards.filter((v) => getVehicleStatus(v.lastInspection).label === 'Atenção').length})`,
                },
                {
                  key: 'atrasados',
                  label: `Atrasados (${vehicleCards.filter((v) => getVehicleStatus(v.lastInspection).label === 'Atrasado').length})`,
                },
                {
                  key: 'sem-inspecao',
                  label: `Sem inspeção (${vehicleCards.filter((v) => getVehicleStatus(v.lastInspection).label === 'Sem inspeção').length})`,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFiltro(item.key as typeof filtro)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filtro === item.key
                      ? 'bg-[#2f6eea] text-white'
                      : 'bg-[#050827] border border-[#1d2466] text-slate-300 hover:bg-[#0b1050]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#070b3f] border border-[#1d2466] rounded-3xl p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Veículos</h2>
              <p className="text-slate-400 mt-1">
                Clique em um card para abrir o histórico completo do veículo.
              </p>
            </div>

            <div className="rounded-2xl border border-[#1d2466] bg-[#050827] px-4 py-3 text-sm text-slate-300">
              Última atividade:{' '}
              <span className="text-white font-semibold">
                {ultimaAtividade
                  ? `${formatDateTime(ultimaAtividade.created_at)} • ${ultimaAtividade.profiles?.nome || 'Não identificado'}`
                  : 'Nenhuma inspeção registrada'}
              </span>
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="bg-[#050827] border border-[#1d2466] rounded-2xl p-6 text-slate-300">
              Nenhum veículo encontrado para este filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredVehicles.map((vehicle) => {
                const status = getVehicleStatus(vehicle.lastInspection)

                return (
                  <button
                    key={vehicle.id}
                    onClick={() => router.push(`/gestor/veiculo/${vehicle.id}`)}
                    className="text-left rounded-2xl overflow-hidden border border-[#1d2466] bg-[#050827] hover:bg-[#0b1050] hover:border-[#2f6eea] transition group"
                  >
                    <div className={`h-1.5 w-full ${status.lineClass}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">
                            Placa
                          </p>
                          <h3 className="text-2xl font-bold mt-2">
                            {vehicle.placa}
                          </h3>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 text-sm">
                        <div>
                          <p className="text-slate-500">Modelo</p>
                          <p className="text-slate-200 font-medium mt-1">{vehicle.modelo}</p>
                        </div>

                        <div>
                          <p className="text-slate-500">Última inspeção</p>
                          <p className="text-slate-200 font-medium mt-1">
                            {vehicle.lastInspection
                              ? formatDate(vehicle.lastInspection.inspection_date)
                              : 'Não registrada'}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Responsável</p>
                          <p className="text-slate-200 font-medium mt-1 line-clamp-1">
                            {vehicle.lastInspection?.profiles?.nome || 'Não identificado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Hodômetro</p>
                          <p className="text-slate-200 font-medium mt-1">
                            {vehicle.lastInspection?.odometer
                              ? `${vehicle.lastInspection.odometer} km`
                              : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-[#1d2466] bg-[#070b3f] p-3">
                        <p className="text-slate-500 text-xs uppercase tracking-wide">
                          Última atualização
                        </p>
                        <p className="text-slate-200 text-sm mt-1">
                          {vehicle.lastInspection
                            ? formatDateTime(vehicle.lastInspection.created_at)
                            : 'Sem movimentação'}
                        </p>
                      </div>

                      <div className="mt-5 text-sm font-semibold text-yellow-400 group-hover:text-yellow-300">
                        Abrir histórico →
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}