'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  nome: string
  username: string
  email: string
  role: 'admin' | 'supervisor' | 'tecnico'
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
    const novaSenha = prompt('Nova senha:')

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
    if (role === 'admin') {
      return 'bg-[#d9534f] text-white'
    }

    if (role === 'supervisor') {
      return 'bg-[#f0ad4e] text-white'
    }

    return 'bg-[#35c6cf] text-white'
  }

  function getRoleLabel(role: string) {
    if (role === 'admin') return 'Administrador'
    if (role === 'supervisor') return 'Supervisor'
    return 'Técnico'
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Administração
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">
            Gestão de Usuários
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Controle acessos, cargos, aprovação e redefinição de senha.
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Usuários cadastrados
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Gerencie os acessos do sistema de forma centralizada.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {users.length} usuário(s)
            </div>
          </div>

          <div className="p-6">
            {erro && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {loading ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Carregando usuários...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-md border border-slate-200 bg-[#fafbfd] p-5 transition hover:border-[#2f6eea] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-slate-800">
                          {user.nome}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Usuário:{' '}
                          <span className="font-semibold text-slate-700">
                            {user.username}
                          </span>
                        </p>

                        <p className="mt-1 text-sm text-slate-500 break-all">
                          E-mail interno: {user.email}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                              user.active ? 'bg-[#38a96a]' : 'bg-[#6c757d]'
                            }`}
                          >
                            {user.active ? 'Ativo' : 'Inativo'}
                          </span>

                          {user.role === 'tecnico' && (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                                user.approved ? 'bg-[#4a90e2]' : 'bg-[#f0ad4e]'
                              }`}
                            >
                              {user.approved ? 'Aprovado' : 'Pendente'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:min-w-[430px]">
                        <button
                          onClick={() =>
                            updateUser(user.id, 'active', !user.active)
                          }
                          disabled={salvandoId === user.id}
                          className="rounded-md bg-[#6c757d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5c6670] disabled:opacity-70"
                        >
                          {user.active ? 'Desativar usuário' : 'Ativar usuário'}
                        </button>

                        {user.role === 'tecnico' && !user.approved ? (
                          <button
                            onClick={() =>
                              updateUser(user.id, 'approved', true)
                            }
                            disabled={salvandoId === user.id}
                            className="rounded-md bg-[#38a96a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2f8f59] disabled:opacity-70"
                          >
                            Aprovar técnico
                          </button>
                        ) : (
                          <button
                            onClick={() => resetPassword(user.id)}
                            disabled={salvandoId === user.id}
                            className="rounded-md bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:opacity-70"
                          >
                            Resetar senha
                          </button>
                        )}

                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateUser(user.id, 'role', e.target.value)
                          }
                          disabled={salvandoId === user.id}
                          className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2f6eea] focus:ring-2 focus:ring-[#2f6eea]/10 disabled:opacity-70"
                        >
                          <option value="admin">Administrador</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="tecnico">Técnico</option>
                        </select>

                        <button
                          onClick={() => resetPassword(user.id)}
                          disabled={salvandoId === user.id}
                          className="rounded-md border border-[#2f6eea] bg-white px-4 py-3 text-sm font-bold text-[#2f6eea] transition hover:bg-[#f3f7ff] disabled:opacity-70"
                        >
                          Alterar senha
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