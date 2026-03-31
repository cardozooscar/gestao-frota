'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Profile = {
  nome: string
  username: string
}

export default function TecnicoPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('nome, username, role, approved')
        .eq('id', data.user.id)
        .single()

      if (error || !profileData || profileData.role !== 'tecnico') {
        router.push('/login')
        return
      }

      if (!profileData.approved) {
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      setProfile({
        nome: profileData.nome,
        username: profileData.username,
      })

      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#02052b] text-white flex items-center justify-center">
        <p>Carregando painel do técnico...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#02052b] text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em]">Painel do Técnico</p>
              <h1 className="text-4xl font-bold mt-2">Bem-vindo</h1>
              <p className="text-slate-300 mt-2">
                {profile?.nome} {profile?.username ? `(@${profile.username})` : ''}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/tecnico/nova-inspecao')}
                className="bg-[#2f6eea] hover:bg-[#255ed0] rounded-lg px-5 py-3 font-bold transition"
              >
                Nova inspeção
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="bg-red-600 hover:bg-red-700 rounded-lg px-5 py-3 font-semibold transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Ação principal</p>
            <h2 className="text-2xl font-bold mt-3">Registrar inspeção</h2>
            <p className="text-slate-300 mt-2 text-sm">
              Preencha checklist, hodômetro e envie as fotos do veículo.
            </p>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Fotos obrigatórias</p>
            <h2 className="text-2xl font-bold mt-3 text-yellow-400">5 imagens</h2>
            <p className="text-slate-300 mt-2 text-sm">
              Frente, fundo, laterais e hodômetro.
            </p>
          </div>

          <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Status</p>
            <h2 className="text-2xl font-bold mt-3 text-green-400">Pronto para uso</h2>
            <p className="text-slate-300 mt-2 text-sm">
              Sistema liberado para lançamento de inspeções.
            </p>
          </div>
        </div>

        <div className="bg-[#070b3f] border border-[#1d2466] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-3">Inspeções</h2>
          <p className="text-slate-300 mb-5">
            Use o botão abaixo para abrir um novo checklist do veículo.
          </p>

          <button
            onClick={() => router.push('/tecnico/nova-inspecao')}
            className="bg-[#2f6eea] hover:bg-[#255ed0] rounded-lg px-5 py-3 font-bold transition"
          >
            Abrir nova inspeção
          </button>
        </div>
      </div>
    </main>
  )
}