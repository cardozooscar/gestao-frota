'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User, AtSign, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react'

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
    <main className="relative min-h-screen flex items-center justify-center bg-[#02052b] text-white px-4 py-8 overflow-hidden">
      
      {/* EFEITOS DE LUZ NO FUNDO (BLOBS) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#070b3f] shadow-inner">
              <img
                src="https://raw.githubusercontent.com/cardozooscar/imagenscgr/refs/heads/main/WhatsApp_Image_2025-10-30_at_10.21.26__1_-removebg-preview.png"
                alt="Fibranet"
                className="max-h-12 max-w-12 object-contain"
              />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400">
              Fibranet Brasil
            </p>

            <h1 className="text-3xl font-black mt-2 tracking-tight">
              Criar Acesso
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Preencha os dados para solicitar sua conta
            </p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-4">
            
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-[#2f6eea] focus:ring-1 focus:ring-[#2f6eea] placeholder-slate-500"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <AtSign size={18} />
              </div>
              <input
                type="text"
                placeholder="Usuário (login)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-[#2f6eea] focus:ring-1 focus:ring-[#2f6eea] placeholder-slate-500"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-[#2f6eea] focus:ring-1 focus:ring-[#2f6eea] placeholder-slate-500"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Crie uma senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#02052b] pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-[#2f6eea] focus:ring-1 focus:ring-[#2f6eea] placeholder-slate-500"
                required
              />
            </div>

            {erro && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400 text-sm font-bold text-center">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-400 text-sm font-bold text-center">
                {sucesso}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={salvando}
                className="group w-full flex items-center justify-center gap-2 rounded-xl bg-[#2f6eea] hover:bg-[#255ed0] py-4 font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {salvando ? 'PROCESSANDO...' : (
                  <><UserPlus size={18} /> SOLICITAR ACESSO</>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 py-4 font-bold text-slate-300 transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={18} className="text-slate-500" /> VOLTAR AO LOGIN
              </button>
            </div>
          </form>

        </div>
      </div>
    </main>
  )
}