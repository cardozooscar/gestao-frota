'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Activity, 
  User, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Clock,
  AtSign
} from 'lucide-react'

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
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <ShieldCheck size={14} /> Gestão de acessos
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Aprovações</h1>
            <p className="mt-2 text-sm text-slate-400">Libere ou exclua cadastros pendentes de técnicos.</p>
          </div>
        </div>

        {erro && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
            {erro}
          </div>
        )}

        {/* INDICADORES (Cards Superiores) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-600/20 to-orange-600/5 p-6 backdrop-blur-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pendentes</p>
              <h2 className="mt-2 text-4xl font-black tracking-tighter text-white">{usuarios.length}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Aguardando aprovação</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl"><Clock className="text-orange-400" /></div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-blue-600/5 p-6 backdrop-blur-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ação</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Manual</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Controle centralizado</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl"><UserCheck className="text-blue-400" /></div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 p-6 backdrop-blur-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fluxo</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Protegido</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Acesso monitorado</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl"><Activity className="text-emerald-400" /></div>
          </div>
        </div>

        {/* LISTAGEM DE PENDENTES */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Users size={20} className="text-blue-400" /> Cadastros pendentes
              </h2>
              <p className="text-xs text-slate-400 mt-1">Aprove ou exclua usuários técnicos aguardando liberação.</p>
            </div>

            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-2 text-xs font-bold text-orange-400 flex items-center gap-2">
              <Clock size={14} /> {usuarios.length} pendente(s)
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-slate-400">Carregando pendentes...</div>
            ) : usuarios.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-16 flex flex-col items-center justify-center gap-3">
                <ShieldCheck size={48} className="text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400">Tudo limpo por aqui!</p>
                <p className="text-xs text-slate-500">Nenhum técnico aguardando aprovação no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-[#2f6eea] hover:shadow-lg hover:shadow-blue-500/5"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                      
                      {/* INFORMAÇÕES DO USUÁRIO */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-xl font-black text-white">{usuario.nome}</h2>
                          <span className="rounded-md bg-orange-500/20 border border-orange-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                            Pendente
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                              <AtSign size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuário</p>
                              <p className="font-medium text-slate-300">{usuario.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                              <Mail size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail</p>
                              <p className="font-medium text-slate-300">{usuario.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                              <Calendar size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cadastro em</p>
                              <p className="font-medium text-slate-300">{new Date(usuario.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BOTÕES DE AÇÃO */}
                      <div className="flex gap-3 pt-4 xl:pt-0 border-t border-white/5 xl:border-t-0 xl:border-l xl:pl-6">
                        <button
                          onClick={() => aprovar(usuario.id)}
                          disabled={processandoId === usuario.id}
                          className="flex-1 xl:flex-none flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                        >
                          <CheckCircle2 size={18} />
                          {processandoId === usuario.id ? 'PROCESSANDO...' : 'APROVAR'}
                        </button>

                        <button
                          onClick={() => excluir(usuario.id)}
                          disabled={processandoId === usuario.id}
                          className="flex-1 xl:flex-none flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-6 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          <XCircle size={18} />
                          {processandoId === usuario.id ? '...' : 'RECUSAR'}
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