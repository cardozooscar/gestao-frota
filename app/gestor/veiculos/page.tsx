'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type Vehicle = {
  id: string
  placa: string
  modelo: string
  ownership_type: 'proprio' | 'alugado'
  ativo: boolean
}

export default function VeiculosPage() {
  const router = useRouter()

  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ownershipType, setOwnershipType] = useState<'proprio' | 'alugado'>('proprio')
  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)

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

      const response = await fetch('/api/gestor/veiculos')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar veículos')
      }

      setVeiculos(result.data || [])
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
        body: JSON.stringify({ placa, modelo, ownershipType }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar veículo')
      }

      setSucesso('Veículo cadastrado com sucesso.')
      setPlaca('')
      setModelo('')
      setOwnershipType('proprio')
      await carregarVeiculos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar veículo')
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
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em]">Gestão de veículos</p>
              <h1 className="text-4xl font-bold mt-2">Cadastro de Veículos</h1>
              <p className="text-slate-300 mt-2">
                Cadastre os veículos da frota e defina se são próprios ou alugados.
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
          <h2 className="text-2xl font-bold mb-4">Novo veículo</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
              required
            />

            <input
              type="text"
              placeholder="Modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
              required
            />

            <select
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value as 'proprio' | 'alugado')}
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
              required
            >
              <option value="proprio">Próprio</option>
              <option value="alugado">Alugado</option>
            </select>

            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] px-4 py-3 font-bold"
            >
              {salvando ? 'SALVANDO...' : 'CADASTRAR VEÍCULO'}
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
          <h2 className="text-2xl font-bold mb-4">Veículos cadastrados</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : veiculos.length === 0 ? (
            <p className="text-slate-300">Nenhum veículo cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {veiculos.map((veiculo) => (
                <div
                  key={veiculo.id}
                  className="bg-[#050827] border border-[#1d2466] rounded-2xl p-5"
                >
                  <h3 className="text-xl font-semibold">{veiculo.placa}</h3>
                  <p className="text-slate-300 mt-1">Modelo: {veiculo.modelo}</p>
                  <p className="text-slate-400 mt-1">
                    Tipo: {veiculo.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
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