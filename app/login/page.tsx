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

      let emailParaLogin = ''

      if (loginNormalizado.includes('@')) {
        emailParaLogin = loginNormalizado
      } else {
        const { data: profile, error: profileLookupError } = await supabase
          .from('profiles')
          .select('id, email, role, approved')
          .eq('username', loginNormalizado)
          .maybeSingle()

        if (profileLookupError) throw new Error('Erro ao localizar usuário.')
        if (!profile) throw new Error('Usuário não encontrado.')

        if (profile.role === 'tecnico' && !profile.approved) {
          throw new Error('Seu cadastro ainda não foi aprovado pelo gestor.')
        }

        emailParaLogin = profile.email
      }

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: emailParaLogin,
          password: senha,
        })

      if (loginError) throw new Error('Usuário ou senha inválidos.')
      if (!loginData.user) throw new Error('Falha ao autenticar usuário.')

      const { data: profileFinal } = await supabase
        .from('profiles')
        .select('role, approved')
        .eq('id', loginData.user.id)
        .single()

      if (profileFinal.role === 'admin' || profileFinal.role === 'supervisor') {
  router.push('/gestor')
} else if (profileFinal.role === 'tecnico') {
  router.push('/tecnico')
} else {
  throw new Error('Perfil inválido.')
}
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#02052b] text-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-[28px] border border-[#1d2466] bg-[#070b3f] p-8 shadow-2xl">
          
          {/* LOGO */}
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

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Usuário ou e-mail"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none focus:border-[#2f6eea]"
              required
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-[#1d2466] bg-[#050827] px-4 py-3 outline-none focus:border-[#2f6eea]"
              required
            />

            {erro && (
              <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] py-3 font-bold transition"
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