'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Link2, Car, User, Settings2, Unlink, Calendar, ShieldCheck, AlertCircle } from 'lucide-react'

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

  async function handleDesvincular(assignmentId: string) {
    if (!confirm('Deseja realmente desvincular este veículo do técnico?')) return

    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const response = await fetch('/api/gestor/vinculos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao desvincular')
      }

      setSucesso('Veículo desvinculado com sucesso.')
      await carregarDados()
    } catch (err: any) {
      setErro(err.message || 'Erro ao desvincular')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Link2 size={14} /> Operação
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Vínculos</h1>
            <p className="mt-2 text-sm text-slate-400">Defina qual veículo está liberado para cada técnico em tempo real.</p>
          </div>
        </div>

        {/* FORMULÁRIO DE NOVO VÍNCULO */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Link2 size={20} className="text-blue-400" /> Novo vínculo
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ao vincular, o sistema revoga automaticamente vínculos anteriores do técnico ou veículo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <User size={16} />
              </div>
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070b3f] pl-12 pr-4 py-3 text-sm text-white outline-none transition focus:border-[#2f6eea] appearance-none"
                required
              >
                <option value="" className="bg-[#02052b]">Selecione o técnico</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id} className="bg-[#02052b]">
                    {tecnico.nome} ({tecnico.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <Car size={16} />
              </div>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070b3f] pl-12 pr-4 py-3 text-sm text-white outline-none transition focus:border-[#2f6eea] appearance-none"
                required
              >
                <option value="" className="bg-[#02052b]">Selecione o veículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id} className="bg-[#02052b]">
                    {vehicle.placa} - {vehicle.modelo}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? 'PROCESSANDO...' : 'VINCULAR VEÍCULO'}
            </button>
          </form>

          {erro && <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{erro}</div>}
          {sucesso && <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">{sucesso}</div>}
        </div>

        {/* LISTAGEM DE VÍNCULOS ATIVOS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Settings2 size={20} className="text-blue-400" /> Vínculos ativos
              </h2>
              <p className="text-xs text-slate-400 mt-1">Painel em tempo real de quem está com qual veículo.</p>
            </div>

            <div className="flex items-center">
              <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-400">
                {activeAssignments.length} vínculo(s)
              </div>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-slate-400">Carregando vínculos...</div>
            ) : activeAssignments.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-12 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={32} className="text-slate-500" />
                <p className="text-sm text-slate-400">Nenhum veículo vinculado no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {activeAssignments.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:-translate-y-1 hover:border-[#2f6eea] hover:shadow-2xl hover:shadow-blue-500/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      {/* Nome do Técnico */}
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                          {item.profiles?.nome || 'Técnico não identificado'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          @{item.profiles?.username || '-'}
                        </p>
                      </div>

                      {/* Tags de Status */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">
                          <User size={10} /> Em Campo
                        </span>
                      </div>
                    </div>

                    {/* Detalhes do Vínculo */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                          <Car size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Veículo Liberado</p>
                          <p className="font-bold text-white text-base">
                            {item.vehicles?.placa || '-'} <span className="text-slate-400 font-medium text-sm ml-1">{item.vehicles?.modelo ? `(${item.vehicles.modelo})` : ''}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Liberado em</p>
                            <p className="font-medium text-slate-300">
                              {new Date(item.started_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        {/* BOTÃO DE DESVINCULAR */}
                        <button
                          onClick={() => handleDesvincular(item.id)}
                          disabled={salvando}
                          className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          <Unlink size={14} /> DESVINCULAR
                        </button>
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