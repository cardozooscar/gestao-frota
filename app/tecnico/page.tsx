'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Car, FileText, Camera, LogOut, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Tipagens básicas
type ActiveVehicle = {
  placa: string
  modelo: string
}

type LastInspection = {
  id: string
  inspection_date: string
  vehicles: { placa: string }
}

export default function TecnicoDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ nome: string; username?: string } | null>(null)
  const [veiculoAtivo, setVeiculoAtivo] = useState<ActiveVehicle | null>(null)
  const [ultimasInspecoes, setUltimasInspecoes] = useState<LastInspection[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Pegar Usuário Logado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 2. Buscar Perfil (Nome/User)
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, username')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profile)

        // 3. Buscar Veículo Vinculado (ended_at IS NULL)
        const { data: assignment } = await supabase
          .from('vehicle_assignments')
          .select('vehicles(placa, modelo)')
          .eq('profile_id', user.id)
          .is('ended_at', null)
          .maybeSingle()

        if (assignment?.vehicles) {
          // @ts-ignore
          setVeiculoAtivo(assignment.vehicles)
        }

        // 4. Buscar Últimas 3 Inspeções
        const { data: inspections } = await supabase
          .from('inspections')
          .select('id, inspection_date, vehicles(placa)')
          .eq('profile_id', user.id)
          .order('inspection_date', { ascending: false })
          .limit(3)

        // @ts-ignore
        setUltimasInspecoes(inspections || [])

      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02052b] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#02052b] text-white p-4 pb-10">
      <div className="mx-auto max-w-md space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-[24px] p-5 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bem-vindo,</span>
            <h1 className="text-xl font-black text-white">{userProfile?.nome || 'Técnico'}</h1>
            <span className="text-xs text-blue-400 font-medium">@{userProfile?.username || 'user.tecnico'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* CARD VEÍCULO EM USO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 shadow-xl shadow-blue-900/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <Car size={14} /> Veículo em uso
            </div>

            {veiculoAtivo ? (
              <>
                <h2 className="text-3xl font-black tracking-tighter text-white">{veiculoAtivo.placa}</h2>
                <p className="text-blue-100 font-medium mt-1 uppercase text-sm">{veiculoAtivo.modelo}</p>
              </>
            ) : (
              <p className="text-blue-100 font-medium mt-1">Nenhum veículo vinculado a você.</p>
            )}
          </div>
          <Car size={120} className="absolute -right-6 -bottom-6 text-white/10 rotate-12" />
        </div>

        {/* GRID DE STATUS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
              <Camera size={20} />
            </div>
            <p className="text-xl font-black text-white">6 Fotos</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Obrigatórias</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${veiculoAtivo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {veiculoAtivo ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </div>
            <p className="text-xl font-black text-white">{veiculoAtivo ? 'Liberado' : 'Aguardando'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status</p>
          </div>
        </div>

        {/* BOTÃO NOVA INSPEÇÃO */}
        <Link 
          href={veiculoAtivo ? "/tecnico/inspeção" : "#"}
          className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 font-black text-lg transition-all shadow-lg active:scale-95 ${
            veiculoAtivo 
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20' 
            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          <span className="text-2xl">+</span> NOVA INSPEÇÃO
        </Link>

        {/* HISTÓRICO RECENTE */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <FileText size={14} /> Histórico Recente
          </h3>
          
          <div className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden backdrop-blur-md">
            {ultimasInspecoes.length > 0 ? (
              ultimasInspecoes.map((inspecao, index) => (
                <div 
                  key={inspecao.id} 
                  className={`flex items-center justify-between p-5 hover:bg-white/5 transition-colors ${
                    index !== ultimasInspecoes.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#070b3f] border border-white/10 flex items-center justify-center text-blue-400">
                      <Car size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-white leading-none">{inspecao.vehicles?.placa}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                        {new Date(inspecao.inspection_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500 text-sm">
                Nenhuma inspeção realizada ainda.
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}