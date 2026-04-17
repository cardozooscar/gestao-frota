'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User, Lock, LogIn, UserPlus } from 'lucide-react'

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

      // Adicionamos 'testador' na verificação de aprovação se necessário
      if ((resolvedUser.role === 'tecnico' || resolvedUser.role === 'testador') && !resolvedUser.approved) {
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

      // LÓGICA DE DIRECIONAMENTO POR ROLE
      if (profileFinal.role === 'admin' || profileFinal.role === 'supervisor') {
        router.push('/gestor')
      } else if (profileFinal.role === 'testador') {
        router.push('/tecnico/estoque') // NOVO REDIRECIONAMENTO
      } else if (profileFinal.role === 'tecnico') {
        // Verifica aprovação apenas para quem vai pra rua, ou para ambos
        if (!profileFinal.approved) {
          await supabase.auth.signOut()
          throw new Error('Seu cadastro ainda não foi aprovado.')
        }
        router.push('/tecnico')
      } else {
        throw new Error('Perfil inválido ou sem permissão de acesso.')
      }

    } catch (err: any) {
      setErro(err?.message || 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#02052b] text-white px-4 overflow-hidden">
      
      {/* EFEITOS DE LUZ NO FUNDO */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-[#070b3f] shadow-inner">
              <img
                src="https://raw.githubusercontent.com/cardozooscar/imagenscgr/refs/heads/main/WhatsApp_Image_2025-10-30_at_10.21.26__1_-removebg-preview.png"
                alt="Fibranet"
                className="max-h-16 max-w-16 object-contain"
              />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400">
              Fibranet Brasil
            </p>

            <h1 className="text-3xl font-black mt-2 tracking-tight">
              Acesso ao Sistema
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Insira suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Usuário ou e-mail"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#2f6eea] focus:ring-1 focus:ring-[#2f6eea] placeholder-slate-500"
                required
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#2f6eea] focus:ring-1 focus:ring-[#2f6eea] placeholder-slate-500"
                required
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400 text-sm font-bold whitespace-pre-wrap text-center">
                {erro}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={carregando}
                className="group w-full flex items-center justify-center gap-2 rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] py-4 font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {carregando ? 'ENTRANDO...' : (
                  <>ENTRAR <LogIn size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/cadastro')}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 py-4 font-bold text-slate-300 transition-all active:scale-[0.98]"
              >
                <UserPlus size={18} className="text-slate-500" /> CRIAR NOVO ACESSO
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Sistema Interno • Fibranet Brasil
          </div>
        </div>
      </div>
    </main>
  )
}