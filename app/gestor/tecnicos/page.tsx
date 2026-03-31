'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type Tecnico = {
  id: string
  nome: string
  username: string
  email: string
  role: string
  approved: boolean
  created_at: string
}

export default function TecnicosPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregarTecnicos() {
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

      const response = await fetch('/api/gestor/tecnicos')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar técnicos')
      }

      setTecnicos(result.data || [])
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar técnicos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarTecnicos()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const response = await fetch('/api/gestor/tecnicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar técnico')
      }

      setSucesso(
        `Técnico criado com sucesso. Usuário: ${result.data.username} | Senha padrão: ${result.data.senhaPadrao}`
      )
      setNome('')
      setEmail('')
      await carregarTecnicos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar técnico')
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
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em]">Gestão de técnicos</p>
              <h1 className="text-4xl font-bold mt-2">Cadastro de Técnicos</h1>
              <p className="text-slate-300 mt-2">
                Usuário gerado automaticamente no padrão <strong>nome.tecnico</strong>.
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
          <h2 className="text-2xl font-bold mb-4">Novo técnico</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
              required
            />

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none"
              required
            />

            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] px-4 py-3 font-bold"
            >
              {salvando ? 'CADASTRANDO...' : 'CADASTRAR TÉCNICO'}
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
          <h2 className="text-2xl font-bold mb-4">Técnicos cadastrados</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : tecnicos.length === 0 ? (
            <p className="text-slate-300">Nenhum técnico cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tecnicos.map((tecnico) => (
                <div
                  key={tecnico.id}
                  className="bg-[#050827] border border-[#1d2466] rounded-2xl p-5"
                >
                  <h3 className="text-xl font-semibold">{tecnico.nome}</h3>
                  <p className="text-slate-300 mt-1">Usuário: {tecnico.username}</p>
                  <p className="text-slate-400">E-mail: {tecnico.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}