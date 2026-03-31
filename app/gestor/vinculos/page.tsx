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
    <main className="min-h-screen bg-[#02052b] text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em]">Gestão de vínculos</p>
              <h1 className="text-4xl font-bold mt-2">Veículos por Técnico</h1>
              <p className="text-slate-300 mt-2">
                Vincule e troque veículos mantendo o histórico.
              </p>
            </div>

            <button
              onClick={() => router.push('/gestor')}
              className="bg-[#1d2466] hover:bg-[#28318a] rounded-lg px-5 py-3 font-semibold"
            >
              Voltar
            </button>
          </div>
        </div>

        <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Novo vínculo</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
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
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
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
              className="rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] px-4 py-3 font-bold"
            >
              {salvando ? 'SALVANDO...' : 'VINCULAR VEÍCULO'}
            </button>
          </form>

          {erro && (
            <div className="mt-4 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-300">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="mt-4 rounded-lg border border-green-500 bg-green-500/10 px-4 py-3 text-green-300">
              {sucesso}
            </div>
          )}
        </div>

        <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Vínculos ativos</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : activeAssignments.length === 0 ? (
            <p className="text-slate-300">Nenhum vínculo ativo.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeAssignments.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#050827] border border-[#1d2466] rounded-2xl p-5"
                >
                  <h3 className="text-xl font-semibold">
                    {item.profiles?.nome} ({item.profiles?.username})
                  </h3>
                  <p className="text-slate-300 mt-1">
                    Veículo: {item.vehicles?.placa} - {item.vehicles?.modelo}
                  </p>
                  <p className="text-slate-400 mt-1">
                    Vinculado em: {new Date(item.started_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}