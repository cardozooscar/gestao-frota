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
  AlertCircle,
  Target,
  Loader2
} from 'lucide-react'

type User = {
  id: string
  nome: string
  username: string
  email: string
  role: 'admin' | 'supervisor' | 'tecnico' | 'testador'
  approved: boolean
  active: boolean
  meta_diaria: number // Novo campo
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

      // Atualiza o estado local para ser mais rápido
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [action]: value } : u))
      
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
        body: JSON.stringify({ userId, newPassword: novaSenha }),
      })

      if (!res.ok) throw new Error('Erro ao alterar senha.')
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
    if (role === 'testador') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
  }

  function getRoleLabel(role: string) {
    if (role === 'admin') return 'Administrador'
    if (role === 'supervisor') return 'Supervisor'
    if (role === 'testador') return 'Testador'
    return 'Técnico'
  }

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <ShieldCheck size={14} /> Administração
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Gestão de Equipa</h1>
            <p className="mt-2 text-sm text-slate-400">Controlo de acessos, metas e permissões da Fibranet.</p>
          </div>
        </div>

        {/* LISTAGEM */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-slate-400">Carregando utilizadores...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {users.map((user) => (
                <div key={user.id} className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${user.active ? 'border-white/10 bg-white/5 hover:border-[#2f6eea]' : 'border-red-500/20 bg-red-500/5 opacity-80'}`}>
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 p-6">
                    
                    {/* INFO */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-xl font-black text-white">{user.nome}</h3>
                        <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                        {(user.role === 'tecnico' || user.role === 'testador') && (
                          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md">
                            <Target size={12} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-300 uppercase">Meta: {user.meta_diaria || 0}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <AtSign size={14} /> {user.username}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <Mail size={14} /> {user.email}
                        </div>
                      </div>
                    </div>

                    {/* CONTROLOS */}
                    <div className="flex flex-col gap-3 pt-4 xl:pt-0 border-t border-white/5 xl:border-t-0 xl:border-l xl:pl-6 min-w-[300px]">
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Seletor de Cargo */}
                        <div className="relative col-span-1">
                          <select
                            value={user.role}
                            onChange={(e) => updateUser(user.id, 'role', e.target.value)}
                            disabled={salvandoId === user.id}
                            className="w-full rounded-xl border border-white/10 bg-[#070b3f] px-3 py-2.5 text-xs text-white outline-none focus:border-[#2f6eea] appearance-none disabled:opacity-50"
                          >
                            <option value="admin">Admin</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="tecnico">Técnico</option>
                            <option value="testador">Testador</option>
                          </select>
                        </div>

                        {/* Input de Meta (Apenas para técnicos/testadores) */}
                        <div className="relative col-span-1">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                            <Target size={14} />
                          </div>
                          <input
                            type="number"
                            placeholder="Meta"
                            defaultValue={user.meta_diaria}
                            onBlur={(e) => updateUser(user.id, 'meta_diaria', parseInt(e.target.value))}
                            disabled={salvandoId === user.id}
                            className="w-full rounded-xl border border-white/10 bg-[#070b3f] pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#2f6eea] disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateUser(user.id, 'active', !user.active)}
                          disabled={salvandoId === user.id}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${user.active ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          <Power size={14} /> {user.active ? 'Bloquear' : 'Ativar'}
                        </button>

                        <button
                          onClick={() => resetPassword(user.id)}
                          disabled={salvandoId === user.id}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition"
                        >
                          <KeyRound size={14} /> Senha
                        </button>
                      </div>

                      {(user.role === 'tecnico' || user.role === 'testador') && !user.approved && (
                        <button
                          onClick={() => updateUser(user.id, 'approved', true)}
                          disabled={salvandoId === user.id}
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          {salvandoId === user.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                          Aprovar Acesso
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
    </main>
  )
}