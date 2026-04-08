'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Car, Plus, Settings2, Power, AlertCircle } from 'lucide-react'

type Vehicle = {
  id: string
  placa: string
  modelo: string
  ownership_type: 'proprio' | 'alugado'
  ativo: boolean | null
  is_active?: boolean | null
  image_url?: string | null
}

type VehicleModel = {
  id: string
  brand: string | null
  model_name: string
  image_url: string | null
  active: boolean
}

type ActiveTab = 'ativos' | 'inativos'

const DEFAULT_CAR_IMAGE =
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'

function normalizeModelName(value: string | null | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isVehicleActive(vehicle: Vehicle) {
  if (typeof vehicle.is_active === 'boolean') return vehicle.is_active
  if (typeof vehicle.ativo === 'boolean') return vehicle.ativo
  return false
}

export default function VeiculosPage() {
  const router = useRouter()

  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [ownershipType, setOwnershipType] = useState<'proprio' | 'alugado'>('proprio')
  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<ActiveTab>('ativos')

  async function carregarVeiculos() {
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

      if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
        router.push('/login')
        return
      }

      const [vehiclesResponse, modelsResponse] = await Promise.all([
        supabase
          .from('vehicles')
          .select('id, placa, modelo, ownership_type, ativo, is_active, image_url')
          .order('placa', { ascending: true }),

        supabase
          .from('vehicle_models')
          .select('id, brand, model_name, image_url, active')
          .eq('active', true)
          .order('model_name', { ascending: true }),
      ])

      if (vehiclesResponse.error) throw new Error(vehiclesResponse.error.message || 'Erro ao carregar veículos')
      if (modelsResponse.error) throw new Error(modelsResponse.error.message || 'Erro ao carregar catálogo de modelos')

      setVeiculos((vehiclesResponse.data || []) as Vehicle[])
      setVehicleModels(modelsResponse.data || [])
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarVeiculos()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const response = await fetch('/api/gestor/veiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa, modelo, ownershipType, imageUrl }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Erro ao cadastrar veículo')

      setSucesso('Veículo cadastrado com sucesso.')
      setPlaca('')
      setModelo('')
      setImageUrl('')
      setOwnershipType('proprio')
      setAbaAtiva('ativos')
      await carregarVeiculos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar veículo')
    } finally {
      setSalvando(false)
    }
  }

  async function handleDesativarVeiculo(e: React.MouseEvent<HTMLButtonElement>, vehicleId: string) {
    e.stopPropagation()
    const confirmado = window.confirm('Deseja realmente desativar este veículo?')
    if (!confirmado) return

    setErro('')
    setSucesso('')
    setProcessandoId(vehicleId)

    try {
      const response = await fetch(`/api/gestor/veiculos/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao desativar veículo')

      setSucesso('Veículo desativado com sucesso.')
      await carregarVeiculos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao desativar veículo')
    } finally {
      setProcessandoId(null)
    }
  }

  async function handleReativarVeiculo(e: React.MouseEvent<HTMLButtonElement>, vehicleId: string) {
    e.stopPropagation()
    const confirmado = window.confirm('Deseja realmente reativar este veículo?')
    if (!confirmado) return

    setErro('')
    setSucesso('')
    setProcessandoId(vehicleId)

    try {
      const response = await fetch(`/api/gestor/veiculos/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao reativar veículo')

      setSucesso('Veículo reativado com sucesso.')
      await carregarVeiculos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao reativar veículo')
    } finally {
      setProcessandoId(null)
    }
  }

  function getVehicleDisplayImage(veiculo: Vehicle) {
    if (veiculo.image_url && veiculo.image_url.trim()) return veiculo.image_url

    const modeloNormalizado = normalizeModelName(veiculo.modelo)
    const matchedModel = vehicleModels.find((item) => {
      const catalogo = normalizeModelName(item.model_name)
      return catalogo === modeloNormalizado || catalogo.includes(modeloNormalizado) || modeloNormalizado.includes(catalogo)
    })

    if (matchedModel?.image_url && matchedModel.image_url.trim()) return matchedModel.image_url
    return DEFAULT_CAR_IMAGE
  }

  const veiculosAtivos = useMemo(() => veiculos.filter(isVehicleActive), [veiculos])
  const veiculosInativos = useMemo(() => veiculos.filter((v) => !isVehicleActive(v)), [veiculos])
  const listaExibida = abaAtiva === 'ativos' ? veiculosAtivos : veiculosInativos

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Car size={14} /> Frota
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Veículos</h1>
            <p className="mt-2 text-sm text-slate-400">Cadastre e gerencie os veículos da operação.</p>
          </div>
        </div>

        {/* NOVO VEÍCULO */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Plus size={20} className="text-blue-400" /> Novo veículo
            </h2>
            <p className="text-xs text-slate-400 mt-1">Preencha os dados principais para adicionar um novo item à frota.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <input
              type="text" placeholder="Placa (ex: ABC-1234)" value={placa} onChange={(e) => setPlaca(e.target.value)} required
              className="rounded-xl border border-white/10 bg-[#070b3f] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#2f6eea] uppercase"
            />
            <input
              type="text" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} required
              className="rounded-xl border border-white/10 bg-[#070b3f] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#2f6eea]"
            />
            <select
              value={ownershipType} onChange={(e) => setOwnershipType(e.target.value as 'proprio' | 'alugado')} required
              className="rounded-xl border border-white/10 bg-[#070b3f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#2f6eea] appearance-none"
            >
              <option value="proprio">Próprio</option>
              <option value="alugado">Alugado</option>
            </select>
            <input
              type="url" placeholder="URL da imagem (opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#070b3f] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#2f6eea] md:col-span-2"
            />
            <button
              type="submit" disabled={salvando}
              className="rounded-xl bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-5 flex items-center justify-center gap-2"
            >
              {salvando ? 'SALVANDO...' : 'CADASTRAR VEÍCULO'}
            </button>
          </form>

          {erro && <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{erro}</div>}
          {sucesso && <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">{sucesso}</div>}
        </div>

        {/* LISTAGEM */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Settings2 size={20} className="text-blue-400" /> Veículos cadastrados
              </h2>
              <p className="text-xs text-slate-400 mt-1">Visualize rapidamente os veículos disponíveis no sistema.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-400">
                Total: {veiculos.length}
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400">
                Ativos: {veiculosAtivos.length}
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400">
                Inativos: {veiculosInativos.length}
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="inline-flex rounded-xl border border-white/5 bg-[#070b3f] p-1">
              <button
                type="button" onClick={() => setAbaAtiva('ativos')}
                className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${abaAtiva === 'ativos' ? 'bg-[#2f6eea] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Ativos ({veiculosAtivos.length})
              </button>
              <button
                type="button" onClick={() => setAbaAtiva('inativos')}
                className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${abaAtiva === 'inativos' ? 'bg-[#d9534f] text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Inativos ({veiculosInativos.length})
              </button>
            </div>
          </div>

          <div>
            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-slate-400">Carregando frota...</div>
            ) : listaExibida.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-12 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={32} className="text-slate-500" />
                <p className="text-sm text-slate-400">{abaAtiva === 'ativos' ? 'Nenhum veículo ativo cadastrado.' : 'Nenhum veículo inativo cadastrado.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listaExibida.map((veiculo) => {
                  const ativo = isVehicleActive(veiculo)

                  return (
                    <div
                      key={veiculo.id}
                      onClick={() => router.push(`/gestor/veiculos/${veiculo.id}`)}
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-1 hover:border-[#2f6eea] hover:shadow-2xl hover:shadow-blue-500/10"
                    >
                      {/* IMAGEM E BADGES (Lógica Original Mantida!) */}
                      <div className="relative h-52 w-full overflow-hidden bg-[#070b3f]">
                        <img
                          src={getVehicleDisplayImage(veiculo)}
                          alt={veiculo.placa}
                          onError={(e) => {
                            const target = e.currentTarget
                            if (target.src !== DEFAULT_CAR_IMAGE) target.src = DEFAULT_CAR_IMAGE
                          }}
                          className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                        />

                        {/* Tag: Propriedade */}
                        <div className="absolute left-3 top-3">
                          <span className={`inline-flex rounded text-[10px] px-2 py-1 font-bold uppercase tracking-wider backdrop-blur-md ${veiculo.ownership_type === 'proprio' ? 'bg-[#35c6cf]/90 text-white' : 'bg-[#6b63b5]/90 text-white'}`}>
                            {veiculo.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
                          </span>
                        </div>

                        {/* Tag: Status */}
                        <div className="absolute right-3 top-3 flex items-center gap-2">
                          <span className={`inline-flex rounded text-[10px] px-2 py-1 font-bold uppercase tracking-wider text-white backdrop-blur-md ${ativo ? 'bg-[#38a96a]/90' : 'bg-[#d9534f]/90'}`}>
                            {ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>

                      {/* INFO E AÇÕES */}
                      <div className="p-6">
                        <h3 className="text-2xl font-black tracking-tight text-white">{veiculo.placa}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-400">{veiculo.modelo}</p>

                        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                          {ativo ? (
                            <button
                              type="button" onClick={(e) => handleDesativarVeiculo(e, veiculo.id)} disabled={processandoId === veiculo.id}
                              className="flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50"
                              title="Desativar veículo"
                            >
                              <Power size={14} /> {processandoId === veiculo.id ? '...' : 'Desativar'}
                            </button>
                          ) : (
                            <button
                              type="button" onClick={(e) => handleReativarVeiculo(e, veiculo.id)} disabled={processandoId === veiculo.id}
                              className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                              title="Reativar veículo"
                            >
                              <Power size={14} /> {processandoId === veiculo.id ? '...' : 'Reativar'}
                            </button>
                          )}
                          
                          <div className="text-[10px] font-bold text-[#2f6eea] uppercase tracking-wider group-hover:text-blue-400 transition-colors flex items-center gap-1">
                            Detalhes <span className="text-lg leading-none">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}