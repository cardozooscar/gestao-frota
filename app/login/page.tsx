'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const loginNormalizado = login.trim().toLowerCase()
      const senhaNormalizada = senha.trim()

      if (!loginNormalizado || !senhaNormalizada) {
        throw new Error('Preencha usuário/e-mail e senha.')
      }

      const resolveResponse = await fetch('/api/gestor/auth/resolve-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: loginNormalizado }),
      })

      const contentType = resolveResponse.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        const textoErro = await resolveResponse.text()
        console.error('Resposta não-JSON da API /api/gestor/auth/resolve-login:', textoErro)
        throw new Error('A rota interna de login não respondeu corretamente.')
      }

      const resolveResult = await resolveResponse.json()

      if (!resolveResponse.ok || !resolveResult?.data?.email) {
        throw new Error(resolveResult?.error || 'Não foi possível localizar o usuário.')
      }

      const resolvedUser = resolveResult.data
      const emailResolvido = String(resolvedUser.email).trim().toLowerCase()

      if (!resolvedUser.active) {
        throw new Error('Usuário desativado. Procure o administrador.')
      }

      if (resolvedUser.role === 'tecnico' && !resolvedUser.approved) {
        throw new Error('Seu cadastro ainda não foi aprovado pelo gestor.')
      }

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: emailResolvido,
          password: senhaNormalizada,
        })

      if (loginError) {
        throw new Error(
          `Usuário ou senha inválidos.\nE-mail resolvido: ${emailResolvido}\nDetalhe: ${loginError.message}`
        )
      }

      if (!loginData.user) {
        throw new Error('Falha ao autenticar usuário.')
      }

      const { data: profileFinal, error: profileFinalError } = await supabase
        .from('profiles')
        .select('role, approved, active')
        .eq('id', loginData.user.id)
        .single()

      if (profileFinalError) {
        throw new Error(`Erro ao carregar perfil: ${profileFinalError.message}`)
      }

      if (!profileFinal) {
        throw new Error('Perfil do usuário não encontrado.')
      }

      if (!profileFinal.active) {
        await supabase.auth.signOut()
        throw new Error('Usuário desativado.')
      }

      if (profileFinal.role === 'tecnico' && !profileFinal.approved) {
        await supabase.auth.signOut()
        throw new Error('Seu cadastro ainda não foi aprovado.')
      }

      if (profileFinal.role === 'admin' || profileFinal.role === 'supervisor') {
        router.push('/gestor')
      } else if (profileFinal.role === 'tecnico') {
        router.push('/tecnico')
      } else {
        throw new Error('Perfil inválido.')
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#02052b] text-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-[28px] border border-[#1d2466] bg-[#070b3f] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-xl border border-[#1d2466] bg-white/5 p-2">
              <img
                src="https://raw.githubusercontent.com/cardozooscar/imagenscgr/refs/heads/main/WhatsApp_Image_2025-10-30_at_10.21.26__1_-removebg-preview.png"
                alt="Fibranet"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              FIBRANET BRASIL
            </p>

            <h1 className="text-2xl font-bold mt-3">
              Acesso ao Painel
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Usuário ou e-mail"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none focus:border-[#2f6eea]"
              required
              autoComplete="username"
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none focus:border-[#2f6eea]"
              required
              autoComplete="current-password"
            />

            {erro && (
              <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-300 text-sm whitespace-pre-wrap">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] py-3 font-bold transition disabled:opacity-60"
            >
              {carregando ? 'ENTRANDO...' : 'ENTRAR'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/cadastro')}
              className="w-full rounded-xl bg-[#1d2466] hover:bg-[#28318a] py-3 font-semibold transition"
            >
              CRIAR NOVO LOGIN
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Sistema interno • Fibranet Brasil
          </div>
        </div>
      </div>
    </main>
  )
}