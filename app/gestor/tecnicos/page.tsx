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
  active?: boolean
  created_at: string
}

export default function TecnicosPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
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
        body: JSON.stringify({
          nome,
          senha,
        }),
      })

      const rawText = await response.text()
      let result: any = {}

      try {
        result = rawText ? JSON.parse(rawText) : {}
      } catch {
        throw new Error('A API de técnicos retornou uma resposta inválida.')
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar técnico')
      }

      setSucesso(
        `Técnico criado com sucesso. Usuário: ${result?.data?.username || '-'}`
      )

      setNome('')
      setSenha('')
      await carregarTecnicos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar técnico')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Equipe
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">Técnicos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cadastre e acompanhe os usuários técnicos da operação.
          </p>
        </div>

        <div className="mb-6 rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-2xl font-bold text-slate-800">Novo técnico</h2>
            <p className="mt-1 text-sm text-slate-500">
              O sistema gera o usuário automaticamente e usa e-mail interno invisível.
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              />

              <input
                type="password"
                placeholder="Senha inicial"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10"
                required
              />

              <button
                type="submit"
                disabled={salvando}
                className="rounded-md bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {salvando ? 'CADASTRANDO...' : 'CADASTRAR TÉCNICO'}
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
              <h2 className="text-2xl font-bold text-slate-800">Técnicos cadastrados</h2>
              <p className="mt-1 text-sm text-slate-500">
                Visualize os usuários técnicos já criados no sistema.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {tecnicos.length} técnico(s)
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Carregando técnicos...
              </div>
            ) : tecnicos.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Nenhum técnico cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {tecnicos.map((tecnico) => (
                  <div
                    key={tecnico.id}
                    className="rounded-md border border-slate-200 bg-[#fafbfd] p-5 transition hover:border-[#2f6eea] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{tecnico.nome}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Usuário: <span className="font-semibold text-slate-700">{tecnico.username}</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          E-mail interno: {tecnico.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#35c6cf] px-3 py-1 text-xs font-bold text-white">
                          Técnico
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                            tecnico.approved ? 'bg-[#38a96a]' : 'bg-[#f0ad4e]'
                          }`}
                        >
                          {tecnico.approved ? 'Aprovado' : 'Pendente'}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                            tecnico.active === false ? 'bg-[#d9534f]' : 'bg-[#4a90e2]'
                          }`}
                        >
                          {tecnico.active === false ? 'Inativo' : 'Ativo'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500">
                      Criado em:{' '}
                      {new Date(tecnico.created_at).toLocaleDateString('pt-BR')}
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