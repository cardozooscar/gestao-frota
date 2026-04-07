'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type PendingUser = {
  id: string
  nome: string
  username: string
  email: string
  role: string
  approved: boolean
  created_at: string
}

export default function AprovacoesPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  async function carregarPendentes() {
    setErro('')
    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        router.push('/login')
        return
      }

      const response = await fetch('/api/gestor/pendentes')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar pendentes')
      }

      setUsuarios(result.data || [])
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar pendentes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPendentes()
  }, [router])

  async function aprovar(profileId: string) {
    try {
      setProcessandoId(profileId)
      setErro('')

      const response = await fetch('/api/gestor/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aprovar técnico')
      }

      await carregarPendentes()
    } catch (err: any) {
      setErro(err.message || 'Erro ao aprovar técnico')
    } finally {
      setProcessandoId(null)
    }
  }

  async function excluir(profileId: string) {
    const confirmar = window.confirm('Tem certeza que deseja excluir este cadastro pendente?')
    if (!confirmar) return

    try {
      setProcessandoId(profileId)
      setErro('')

      const response = await fetch('/api/gestor/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir técnico')
      }

      await carregarPendentes()
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir técnico')
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Gestão de acessos
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">
            Aprovações de Técnicos
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Libere ou exclua cadastros pendentes.
          </p>
        </div>

        {erro && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendentes</p>
            <h2 className="mt-2 text-4xl font-bold text-[#f0ad4e]">
              {usuarios.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Técnicos aguardando aprovação
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ação</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-800">
              Aprovação manual
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Controle centralizado pelo gestor
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Fluxo</p>
            <h2 className="mt-3 text-2xl font-bold text-[#38a96a]">
              Sob controle
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Processo de acesso monitorado
            </p>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Cadastros pendentes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Aprove ou exclua usuários técnicos aguardando liberação.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {usuarios.length} pendente(s)
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Carregando pendentes...
              </div>
            ) : usuarios.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Nenhum técnico pendente de aprovação.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="rounded-md border border-slate-200 bg-[#fafbfd] p-5 transition hover:border-[#2f6eea] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-slate-800">
                          {usuario.nome}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Usuário:{' '}
                          <span className="font-semibold text-slate-700">
                            {usuario.username}
                          </span>
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-500">
                          E-mail interno: {usuario.email}
                        </p>

                        <p className="mt-3 text-sm text-slate-500">
                          Cadastro em{' '}
                          <span className="font-semibold text-slate-700">
                            {new Date(usuario.created_at).toLocaleString('pt-BR')}
                          </span>
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#35c6cf] px-3 py-1 text-xs font-bold text-white">
                            Técnico
                          </span>

                          <span className="rounded-full bg-[#f0ad4e] px-3 py-1 text-xs font-bold text-white">
                            Pendente
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:min-w-[340px]">
                        <button
                          onClick={() => aprovar(usuario.id)}
                          disabled={processandoId === usuario.id}
                          className="rounded-md bg-[#38a96a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f8f59] disabled:opacity-70"
                        >
                          {processandoId === usuario.id ? 'Processando...' : 'Aprovar'}
                        </button>

                        <button
                          onClick={() => excluir(usuario.id)}
                          disabled={processandoId === usuario.id}
                          className="rounded-md bg-[#d9534f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#c83e39] disabled:opacity-70"
                        >
                          {processandoId === usuario.id ? 'Processando...' : 'Excluir'}
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