'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

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

      if (vehiclesResponse.error) {
        throw new Error(vehiclesResponse.error.message || 'Erro ao carregar veículos')
      }

      if (modelsResponse.error) {
        throw new Error(modelsResponse.error.message || 'Erro ao carregar catálogo de modelos')
      }

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

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar veículo')
      }

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

  async function handleDesativarVeiculo(
    e: React.MouseEvent<HTMLButtonElement>,
    vehicleId: string
  ) {
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

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao desativar veículo')
      }

      setSucesso('Veículo desativado com sucesso.')
      await carregarVeiculos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao desativar veículo')
    } finally {
      setProcessandoId(null)
    }
  }

  async function handleReativarVeiculo(
    e: React.MouseEvent<HTMLButtonElement>,
    vehicleId: string
  ) {
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

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao reativar veículo')
      }

      setSucesso('Veículo reativado com sucesso.')
      await carregarVeiculos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao reativar veículo')
    } finally {
      setProcessandoId(null)
    }
  }

  function getVehicleDisplayImage(veiculo: Vehicle) {
    if (veiculo.image_url && veiculo.image_url.trim()) {
      return veiculo.image_url
    }

    const modeloNormalizado = normalizeModelName(veiculo.modelo)

    const matchedModel = vehicleModels.find((item) => {
      const catalogo = normalizeModelName(item.model_name)

      return (
        catalogo === modeloNormalizado ||
        catalogo.includes(modeloNormalizado) ||
        modeloNormalizado.includes(catalogo)
      )
    })

    if (matchedModel?.image_url && matchedModel.image_url.trim()) {
      return matchedModel.image_url
    }

    return DEFAULT_CAR_IMAGE
  }

  const veiculosAtivos = useMemo(
    () => veiculos.filter((veiculo) => isVehicleActive(veiculo)),
    [veiculos]
  )

  const veiculosInativos = useMemo(
    () => veiculos.filter((veiculo) => !isVehicleActive(veiculo)),
    [veiculos]
  )

  const listaExibida = abaAtiva === 'ativos' ? veiculosAtivos : veiculosInativos

  return (
    <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Frota
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">Veículos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cadastre e gerencie os veículos da operação.
          </p>
        </div>

        <div className="mb-6 rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-2xl font-bold text-slate-800">Novo veículo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Preencha os dados principais para adicionar um novo item à frota.
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <input
                type="text"
                placeholder="Placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              />

              <input
                type="text"
                placeholder="Modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              />

              <select
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value as 'proprio' | 'alugado')}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              >
                <option value="proprio">Próprio</option>
                <option value="alugado">Alugado</option>
              </select>

              <input
                type="text"
                placeholder="URL da imagem do veículo (opcional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10 md:col-span-2"
              />

              <button
                type="submit"
                disabled={salvando}
                className="rounded-md bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:cursor-not-allowed disabled:opacity-70 md:col-span-5"
              >
                {salvando ? 'SALVANDO...' : 'CADASTRAR VEÍCULO'}
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
              <h2 className="text-2xl font-bold text-slate-800">Veículos cadastrados</h2>
              <p className="mt-1 text-sm text-slate-500">
                Visualize rapidamente os veículos disponíveis no sistema.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Total: {veiculos.length}
              </div>
              <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Ativos: {veiculosAtivos.length}
              </div>
              <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Inativos: {veiculosInativos.length}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 px-6 py-4">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setAbaAtiva('ativos')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  abaAtiva === 'ativos'
                    ? 'bg-[#2f6eea] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Ativos ({veiculosAtivos.length})
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('inativos')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  abaAtiva === 'inativos'
                    ? 'bg-[#d9534f] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Inativos ({veiculosInativos.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Carregando veículos...
              </div>
            ) : listaExibida.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                {abaAtiva === 'ativos'
                  ? 'Nenhum veículo ativo cadastrado.'
                  : 'Nenhum veículo inativo cadastrado.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {listaExibida.map((veiculo) => {
                  const ativo = isVehicleActive(veiculo)

                  return (
                    <div
                      key={veiculo.id}
                      onClick={() => router.push(`/gestor/veiculos/${veiculo.id}`)}
                      className="group cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-[#fafbfd] transition hover:-translate-y-0.5 hover:border-[#2f6eea] hover:shadow-md"
                    >
                      <div className="relative h-52 w-full overflow-hidden bg-slate-200">
                        <img
                          src={getVehicleDisplayImage(veiculo)}
                          alt={veiculo.placa}
                          onError={(e) => {
                            const target = e.currentTarget
                            if (target.src !== DEFAULT_CAR_IMAGE) {
                              target.src = DEFAULT_CAR_IMAGE
                            }
                          }}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />

                        <div className="absolute left-4 top-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              veiculo.ownership_type === 'proprio'
                                ? 'bg-[#35c6cf] text-white'
                                : 'bg-[#6b63b5] text-white'
                            }`}
                          >
                            {veiculo.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
                          </span>
                        </div>

                        <div className="absolute right-4 top-4 flex items-start gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${
                              ativo ? 'bg-[#38a96a]' : 'bg-[#d9534f]'
                            }`}
                          >
                            {ativo ? 'Ativo' : 'Inativo'}
                          </span>

                          {ativo ? (
                            <button
                              type="button"
                              onClick={(e) => handleDesativarVeiculo(e, veiculo.id)}
                              disabled={processandoId === veiculo.id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Desativar veículo"
                            >
                              {processandoId === veiculo.id ? '...' : '×'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleReativarVeiculo(e, veiculo.id)}
                              disabled={processandoId === veiculo.id}
                              className="rounded-md bg-green-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Reativar veículo"
                            >
                              {processandoId === veiculo.id ? '...' : 'Reativar'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-2xl font-bold text-slate-800">{veiculo.placa}</h3>
                        <p className="mt-1 text-sm text-slate-500">{veiculo.modelo}</p>

                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-sm text-slate-500">Tipo de frota</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {veiculo.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
                          </p>
                        </div>

                        <div className="mt-5 inline-flex items-center text-sm font-semibold text-[#2f6eea] transition group-hover:text-[#214fb1]">
                          Abrir detalhes <span className="ml-1">→</span>
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