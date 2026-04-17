'use client'

import { useEffect, useState } from 'react'
import { 
  ShieldCheck, 
  Users, 
  Mail, 
  AtSign, 
  KeyRound, 
  Power, 
  Settings2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

type User = {
  id: string
  nome: string
  username: string
  email: string
  role: 'admin' | 'supervisor' | 'tecnico' | 'testador'
  approved: boolean
  active: boolean
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  async function fetchUsers() {
    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/gestor/users')
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao carregar usuários.')
      }

      setUsers(json.data || [])
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function updateUser(userId: string, action: string, value: any) {
    try {
      setSalvandoId(userId)

      const res = await fetch('/api/gestor/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao atualizar usuário.')
      }

      await fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar usuário.')
    } finally {
      setSalvandoId(null)
    }
  }

  async function resetPassword(userId: string) {
    const novaSenha = prompt('Digite a nova senha para este usuário:')

    if (!novaSenha) return

    try {
      setSalvandoId(userId)

      const res = await fetch('/api/gestor/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPassword: novaSenha,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao alterar senha.')
      }

      alert('Senha alterada com sucesso.')
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar senha.')
    } finally {
      setSalvandoId(null)
    }
  }

  function getRoleBadge(role: string) {
    if (role === 'admin') return 'bg-red-500/20 text-red-400 border border-red-500/30'
    if (role === 'supervisor') return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
  }

  function getRoleLabel(role: string) {
    if (role === 'admin') return 'Administrador'
    if (role === 'supervisor') return 'Supervisor'
    return 'Técnico'
  }

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <ShieldCheck size={14} /> Administração
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Gestão de Usuários</h1>
            <p className="mt-2 text-sm text-slate-400">Controle acessos, cargos, aprovações e senhas da equipe.</p>
          </div>
        </div>

        {/* LISTAGEM DE USUÁRIOS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Users size={20} className="text-blue-400" /> Usuários cadastrados
              </h2>
              <p className="text-xs text-slate-400 mt-1">Gerencie os acessos do sistema de forma centralizada.</p>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-400">
              {users.length} usuário(s)
            </div>
          </div>

          <div className="mt-8">
            {erro && (
              <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                {erro}
              </div>
            )}

            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-slate-400">Carregando usuários...</div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-16 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={48} className="text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${user.active ? 'border-white/10 bg-white/5 hover:border-[#2f6eea] hover:shadow-blue-500/5' : 'border-red-500/20 bg-red-500/5 opacity-80 grayscale-[20%]'}`}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 p-6">
                      
                      {/* INFORMAÇÕES DO USUÁRIO */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h3 className="text-xl font-black text-white">{user.nome}</h3>
                          
                          {/* Badges de Status */}
                          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>

                          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${user.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                            {user.active ? 'Ativo' : 'Inativo'}
                          </span>

                          {user.role === 'tecnico' && (
                            <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${user.approved ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                              {user.approved ? 'Aprovado' : 'Pendente'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                              <AtSign size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuário</p>
                              <p className="font-medium text-slate-300">{user.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                              <Mail size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail Interno</p>
                              <p className="font-medium text-slate-300">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CONTROLES E AÇÕES */}
                      <div className="flex flex-col gap-3 pt-4 xl:pt-0 border-t border-white/5 xl:border-t-0 xl:border-l xl:pl-6 min-w-[280px]">
                        
                        {/* Seletor de Cargo */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                            <Settings2 size={14} />
                          </div>
                          <select
                            value={user.role}
                            onChange={(e) => updateUser(user.id, 'role', e.target.value)}
                            disabled={salvandoId === user.id}
                            className="w-full rounded-xl border border-white/10 bg-[#070b3f] pl-9 pr-4 py-2.5 text-sm text-white outline-none transition focus:border-[#2f6eea] appearance-none disabled:opacity-50"
                          >
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="tecnico">Técnico</option>
                            <option value="tecnico">Testador</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Botão Ativar/Desativar */}
                          <button
                            onClick={() => updateUser(user.id, 'active', !user.active)}
                            disabled={salvandoId === user.id}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${user.active ? 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                          >
                            <Power size={14} /> {user.active ? 'Bloquear' : 'Ativar'}
                          </button>

                          {/* Botão Resetar Senha */}
                          <button
                            onClick={() => resetPassword(user.id)}
                            disabled={salvandoId === user.id}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2f6eea]/50 bg-[#2f6eea]/10 px-3 py-2.5 text-xs font-bold text-[#2f6eea] transition hover:bg-[#2f6eea] hover:text-white disabled:opacity-50"
                          >
                            <KeyRound size={14} /> Nova Senha
                          </button>
                        </div>

                        {/* Botão de Aprovação (Visível apenas se pendente) */}
                        {user.role === 'tecnico' && !user.approved && (
                          <button
                            onClick={() => updateUser(user.id, 'approved', true)}
                            disabled={salvandoId === user.id}
                            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50 mt-1"
                          >
                            <CheckCircle2 size={16} /> Aprovar Técnico
                          </button>
                        )}
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