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

      // 1. Resolve o login para pegar o e-mail real e a role antes do login
      const resolveResponse = await fetch('/api/gestor/auth/resolve-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginNormalizado }),
      })

      const resolveResult = await resolveResponse.json()

      if (!resolveResponse.ok || !resolveResult?.data?.email) {
        throw new Error(resolveResult?.error || 'Não foi possível localizar o usuário.')
      }

      const resolvedUser = resolveResult.data
      const emailResolvido = String(resolvedUser.email).trim().toLowerCase()

      // 2. Validações iniciais (Ativo e Aprovado)
      if (!resolvedUser.active) {
        throw new Error('Usuário desativado. Procure o administrador.')
      }

      // Adicionamos 'testador' na trava de aprovação
      if ((resolvedUser.role === 'tecnico' || resolvedUser.role === 'testador') && !resolvedUser.approved) {
        throw new Error('Seu cadastro ainda não foi aprovado pelo gestor.')
      }

      // 3. Tenta o login no Supabase Auth
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailResolvido,
        password: senhaNormalizada,
      })

      if (loginError) {
        throw new Error(`Usuário ou senha inválidos.`)
      }

      // 4. Busca o perfil final para garantir o redirecionamento correto
      const { data: profileFinal, error: profileFinalError } = await supabase
        .from('profiles')
        .select('role, approved, active')
        .eq('id', loginData.user.id)
        .single()

      if (profileFinalError || !profileFinal) {
        throw new Error('Perfil do usuário não encontrado.')
      }

      // LÓGICA DE DIRECIONAMENTO CORRIGIDA
      if (profileFinal.role === 'admin' || profileFinal.role === 'supervisor') {
        router.push('/gestor')
      } else if (profileFinal.role === 'testador') {
        router.push('/tecnico/estoque') // Rota da bancada
      } else if (profileFinal.role === 'tecnico') {
        router.push('/tecnico') // Rota da rua
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
    <main className="relative min-h-screen flex items-center justify-center bg-[#02052b] text-white px-4 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl text-center">
          
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-[#070b3f] shadow-inner">
            <img src="https://raw.githubusercontent.com/cardozooscar/imagenscgr/refs/heads/main/WhatsApp_Image_2025-10-30_at_10.21.26__1_-removebg-preview.png" alt="Fibranet" className="max-h-16 max-w-16 object-contain" />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400">Fibranet Brasil</p>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Acesso ao Sistema</h1>
          
          <form onSubmit={handleLogin} className="mt-8 space-y-5 text-left">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Usuário ou e-mail" value={login} onChange={(e) => setLogin(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#2f6eea]" required />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#2f6eea]" required />
            </div>

            {erro && <div className="rounded-xl bg-red-500/10 p-3 text-red-400 text-xs font-bold text-center border border-red-500/20">{erro}</div>}

            <button type="submit" disabled={carregando} className="w-full bg-[#2f6eea] hover:bg-[#255ed0] py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest text-sm">
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}