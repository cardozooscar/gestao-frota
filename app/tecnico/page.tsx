'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  LogOut, 
  Car, 
  Camera, 
  CheckCircle2, 
  ClipboardList, 
  AlertCircle,
  History
} from 'lucide-react'

type Profile = {
  nome: string
  username: string
}

type Assignment = {
  vehicles: {
    placa: string
    modelo: string
  }
}

export default function TecnicoPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      router.push('/login')
      return
    }

    // Busca perfil e veículo vinculado ao mesmo tempo
    const [profileRes, assignmentRes] = await Promise.all([
      supabase.from('profiles').select('nome, username').eq('id', userData.user.id).single(),
      supabase.from('vehicle_assignments')
        .select('vehicles(placa, modelo)')
        .eq('profile_id', userData.user.id)
        .is('ended_at', null)
        .single()
    ])

    setProfile(profileRes.data)
    setAssignment(assignmentRes.data as any)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen bg-[#02052b] flex items-center justify-center text-white">Carregando...</div>

  return (
    <main className="min-h-screen bg-[#02052b] text-white p-4 pb-10">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* HEADER COM SAUDAÇÃO */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div>
            <p className="text-slate-400 text-sm font-medium">Bem-vindo,</p>
            <h1 className="text-2xl font-bold text-white">{profile?.nome || 'Técnico'}</h1>
            <p className="text-xs text-blue-400 font-mono mt-1">@{profile?.username}</p>
          </div>
          <button 
            onClick={handleSair}
            className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={22} />
          </button>
        </div>

        {/* CARD DO VEÍCULO VINCULADO (MUITO IMPORTANTE) */}
        <div className="bg-gradient-to-br from-[#2f6eea] to-[#1d2466] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider mb-4">
              <Car size={14} /> Veículo em uso
            </div>
            {assignment ? (
              <>
                <h2 className="text-4xl font-black tracking-tighter mb-1">{assignment.vehicles.placa}</h2>
                <p className="text-lg text-white/90 font-medium">{assignment.vehicles.modelo}</p>
              </>
            ) : (
              <p className="text-white/80 italic">Nenhum veículo vinculado a você.</p>
            )}
          </div>
          {/* Ícone de fundo decorativo */}
          <Car size={120} className="absolute -right-6 -bottom-6 text-white/5 rotate-12" />
        </div>

        {/* GRADE DE AÇÕES RÁPIDAS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4">
              <Camera size={20} />
            </div>
            <h3 className="font-bold text-sm">6 Fotos</h3>
            <p className="text-xs text-slate-400 mt-1">Obrigatórias por inspeção</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-bold text-sm">Status</h3>
            <p className="text-xs text-slate-400 mt-1">Pronto para rodar</p>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL - CALL TO ACTION */}
        <Link 
          href="/tecnico/nova-inspecao"
          className="group flex items-center justify-center gap-3 w-full bg-[#2f6eea] hover:bg-[#255ed0] text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="group-hover:rotate-90 transition-transform" />
          NOVA INSPEÇÃO
        </Link>

        {/* ATALHOS ADICIONAIS */}
        <div className="space-y-3 pt-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Histórico recente</p>
          
          <button className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-slate-400"><History size={20} /></div>
              <div className="text-left">
                <p className="text-sm font-semibold">Últimas inspeções</p>
                <p className="text-xs text-slate-500">Veja o que você já enviou</p>
              </div>
            </div>
          </button>
        </div>

      </div>
    </main>
  )
}