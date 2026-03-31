'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const usernameNormalizado = username.trim().toLowerCase()

      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameNormalizado)
        .maybeSingle()

      if (existingUsername) {
        throw new Error('Esse usuário já existe.')
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar o usuário.')
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        nome,
        username: usernameNormalizado,
        email,
        role: 'tecnico',
        approved: false,
      })

      if (profileError) {
        throw new Error(profileError.message)
      }

      setSucesso('Cadastro realizado com sucesso. Aguarde aprovação do gestor.')
      setNome('')
      setUsername('')
      setEmail('')
      setSenha('')
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar cadastro.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#02052b] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#070b3f] border border-[#1d2466] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold tracking-tight text-white">Fibranet</div>
          <p className="text-yellow-400 font-semibold mt-6 text-2xl">Criar acesso</p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-4">
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg bg-[#050827] border border-[#1d2466] px-4 py-3 outline-none"
            required
          />

          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-[#050827] border border-[#1d2466] px-4 py-3 outline-none"
            required
          />

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-[#050827] border border-[#1d2466] px-4 py-3 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg bg-[#050827] border border-[#1d2466] px-4 py-3 outline-none"
            required
          />

          {erro && (
            <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-300">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="rounded-lg border border-green-500 bg-green-500/10 px-4 py-3 text-green-300">
              {sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-lg bg-[#2f6eea] hover:bg-[#255ed0] transition px-4 py-3 font-bold"
          >
            {salvando ? 'CRIANDO...' : 'CRIAR CONTA'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full rounded-lg bg-[#1d2466] hover:bg-[#28318a] transition px-4 py-3 font-semibold"
          >
            VOLTAR AO LOGIN
          </button>
        </form>
      </div>
    </main>
  )
}