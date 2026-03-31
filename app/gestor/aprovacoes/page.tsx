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
    <main className="min-h-screen bg-[#02052b] text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em]">Gestão de acessos</p>
              <h1 className="text-4xl font-bold mt-2">Aprovações de Técnicos</h1>
              <p className="text-slate-300 mt-2">
                Libere ou exclua cadastros pendentes.
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

        {erro && (
          <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-300 mb-4">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Pendentes</p>
            <h2 className="text-4xl font-bold mt-2 text-yellow-400">{usuarios.length}</h2>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Ação</p>
            <h2 className="text-2xl font-bold mt-3">Aprovação manual</h2>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Fluxo</p>
            <h2 className="text-2xl font-bold mt-3 text-green-400">Sob controle</h2>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-6">
            Carregando pendentes...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-6">
            Nenhum técnico pendente de aprovação.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
              >
                <div>
                  <h2 className="text-xl font-semibold">{usuario.nome}</h2>
                  <p className="text-slate-300 mt-1">Usuário: {usuario.username}</p>
                  <p className="text-slate-400">E-mail: {usuario.email}</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Cadastro em {new Date(usuario.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => aprovar(usuario.id)}
                    disabled={processandoId === usuario.id}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-lg px-5 py-3 font-bold transition"
                  >
                    Aprovar
                  </button>

                  <button
                    onClick={() => excluir(usuario.id)}
                    disabled={processandoId === usuario.id}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg px-5 py-3 font-bold transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}