'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Car, FileText, Camera, LogOut, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TecnicoDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [veiculoAtivo, setVeiculoAtivo] = useState<any>(null)
  const [ultimasInspecoes, setUltimasInspecoes] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // 1. Pegar Usuário Logado
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error("Erro Auth:", authError)
          router.push('/login')
          return
        }
        console.log("ID do Usuário Logado:", user.id)

        // 2. Buscar Perfil (Simplificado)
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('nome, username')
          .eq('id', user.id)
          .maybeSingle()
        
        if (pError) console.error("Erro Profile:", pError)
        setUserProfile(profile)

        // 3. Buscar Veículo Vinculado (Manual para evitar erro de Join)
        const { data: assignment, error: aError } = await supabase
          .from('vehicle_assignments')
          .select('vehicle_id')
          .eq('profile_id', user.id)
          .is('ended_at', null)
          .maybeSingle()

        if (aError) console.error("Erro Assignment:", aError)

        if (assignment?.vehicle_id) {
          const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('placa, modelo')
            .eq('id', assignment.vehicle_id)
            .single()
          
          setVeiculoAtivo(vehicleData)
          console.log("Veículo Encontrado:", vehicleData)
        }

        // 4. Buscar Últimas 3 Inspeções
        const { data: inspections, error: iError } = await supabase
          .from('inspections')
          .select('id, inspection_date, vehicle_id')
          .eq('profile_id', user.id)
          .order('inspection_date', { ascending: false })
          .limit(3)

        if (iError) console.error("Erro Inspections:", iError)

        if (inspections && inspections.length > 0) {
          // Vamos buscar as placas dos veículos das inspeções manualmente
          const formattedInspections = await Promise.all(inspections.map(async (ins) => {
            const { data: v } = await supabase.from('vehicles').select('placa').eq('id', ins.vehicle_id).single()
            return { ...ins, placa: v?.placa || 'Desconhecido' }
          }))
          setUltimasInspecoes(formattedInspections)
        }

      } catch (error) {
        console.error('Erro Geral:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // ... (Função handleLogout e o restante do JSX é o mesmo do anterior, só mude os nomes das variáveis se necessário)
  
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
            <span className="text-xs text-blue-400 font-medium">@{userProfile?.username || 'user'}</span>
          </div>
          <button onClick={handleLogout} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
            <LogOut size={20} />
          </button>
        </div>

        {/* CARD VEÍCULO EM USO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 shadow-xl">
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
              <p className="text-white font-bold">Nenhum veículo vinculado.</p>
            )}
          </div>
          <Car size={120} className="absolute -right-6 -bottom-6 text-white/10 rotate-12" />
        </div>

        {/* GRID STATUS E BOTÃO (Mantidos) */}
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

        <Link 
          href={veiculoAtivo ? "/tecnico/inspeção" : "#"}
          className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 font-black text-lg transition-all ${veiculoAtivo ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}
        >
          <span className="text-2xl">+</span> NOVA INSPEÇÃO
        </Link>

        {/* HISTÓRICO RECENTE */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <FileText size={14} /> Histórico Recente
          </h3>
          <div className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden">
            {ultimasInspecoes.length > 0 ? (
              ultimasInspecoes.map((ins, idx) => (
                <div key={ins.id} className={`flex items-center justify-between p-5 ${idx !== ultimasInspecoes.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#070b3f] border border-white/10 flex items-center justify-center text-blue-400">
                      <Car size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-white leading-none">{ins.placa}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                        {new Date(ins.inspection_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500 text-sm">Nenhuma inspeção realizada.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}