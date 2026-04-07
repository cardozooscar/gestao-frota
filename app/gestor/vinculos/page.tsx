'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type Tecnico = {
  id: string
  nome: string
  username: string
  email: string
}

type Vehicle = {
  id: string
  placa: string
  modelo: string
  ativo: boolean
}

type ActiveAssignment = {
  id: string
  started_at: string
  ended_at: string | null
  profile_id: string
  vehicle_id: string
  profiles?: {
    id: string
    nome: string
    username: string
  } | null
  vehicles?: {
    id: string
    placa: string
    modelo: string
  } | null
}

export default function VinculosPage() {
  const router = useRouter()

  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [activeAssignments, setActiveAssignments] = useState<ActiveAssignment[]>([])
  const [profileId, setProfileId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  async function carregarDados() {
    setLoading(true)
    setErro('')

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/login')
        return
      }

      const response = await fetch('/api/gestor/vinculos')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar vínculos')
      }

      setTecnicos(result.data.tecnicos || [])
      setVehicles(result.data.vehicles || [])
      setActiveAssignments(result.data.activeAssignments || [])
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const response = await fetch('/api/gestor/vinculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, vehicleId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao vincular veículo')
      }

      setSucesso('Vínculo atualizado com sucesso.')
      setProfileId('')
      setVehicleId('')
      await carregarDados()
    } catch (err: any) {
      setErro(err.message || 'Erro ao vincular veículo')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Operação
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">Vínculos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Defina qual veículo está liberado para cada técnico.
          </p>
        </div>

        <div className="mb-6 rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-2xl font-bold text-slate-800">Novo vínculo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ao criar um novo vínculo, o sistema mantém o histórico e atualiza o técnico e o veículo ativos.
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              >
                <option value="">Selecione o técnico</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome} ({tecnico.username})
                  </option>
                ))}
              </select>

              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              >
                <option value="">Selecione o veículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.placa} - {vehicle.modelo}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={salvando}
                className="rounded-md bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {salvando ? 'SALVANDO...' : 'VINCULAR VEÍCULO'}
              </button>
            </form>

            {erro && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {sucesso}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Vínculos ativos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Veja quais técnicos estão atualmente vinculados aos veículos.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {activeAssignments.length} vínculo(s)
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Carregando vínculos...
              </div>
            ) : activeAssignments.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Nenhum vínculo ativo.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {activeAssignments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-slate-200 bg-[#fafbfd] p-5 transition hover:border-[#2f6eea] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">
                          {item.profiles?.nome || 'Técnico não identificado'}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Usuário:{' '}
                          <span className="font-semibold text-slate-700">
                            {item.profiles?.username || '-'}
                          </span>
                        </p>

                        <p className="mt-3 text-sm text-slate-500">
                          Veículo:{' '}
                          <span className="font-semibold text-slate-700">
                            {item.vehicles?.placa || '-'} {item.vehicles?.modelo ? `- ${item.vehicles.modelo}` : ''}
                          </span>
                        </p>

                        <p className="mt-3 text-sm text-slate-500">
                          Vinculado em:{' '}
                          <span className="font-semibold text-slate-700">
                            {new Date(item.started_at).toLocaleString('pt-BR')}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#35c6cf] px-3 py-1 text-xs font-bold text-white">
                          Técnico ativo
                        </span>

                        <span className="rounded-full bg-[#4a90e2] px-3 py-1 text-xs font-bold text-white">
                          Veículo liberado
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}