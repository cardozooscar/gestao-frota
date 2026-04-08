'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { 
  Car, 
  History, 
  ChevronLeft, 
  Calendar, 
  Gauge, 
  AlertCircle, 
  Settings2,
  FileText,
  User
} from 'lucide-react'

// Tipagens
type Vehicle = {
  id: string
  placa: string
  modelo: string
  ownership_type: 'proprio' | 'alugado'
  ativo: boolean
  is_active?: boolean
  image_url?: string | null
}

type Inspection = {
  id: string
  inspection_date: string
  odometer: number
  observation_general: string
  created_at: string
  profiles?: {
    nome: string
  }
}

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'

export default function VeiculoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [veiculo, setVeiculo] = useState<Vehicle | null>(null)
  const [inspecoes, setInspecoes] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDetalhes() {
      if (!id) return
      setLoading(true)
      
      try {
        // 1. Busca os dados do veículo
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single()

        if (vehicleError) throw new Error('Erro ao carregar os dados do veículo.')
        setVeiculo(vehicleData as Vehicle)

        // 2. Busca o histórico de inspeções desse veículo
        const { data: inspectionsData, error: inspectionsError } = await supabase
          .from('inspections')
          .select('*, profiles(nome)')
          .eq('vehicle_id', id)
          .order('inspection_date', { ascending: false })

        if (!inspectionsError && inspectionsData) {
          setInspecoes(inspectionsData as any)
        }

      } catch (err: any) {
        setErro(err.message || 'Erro inesperado.')
      } finally {
        setLoading(false)
      }
    }

    carregarDetalhes()
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-[#02052b] flex items-center justify-center text-slate-400">Carregando detalhes...</div>
  }

  if (erro || !veiculo) {
    return (
      <div className="min-h-screen bg-[#02052b] flex flex-col items-center justify-center text-white p-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-lg font-bold">Veículo não encontrado.</p>
        <button onClick={() => router.back()} className="mt-6 text-blue-400 hover:underline">Voltar para frota</button>
      </div>
    )
  }

  const isAtivo = veiculo.ativo || veiculo.is_active

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER COM BOTÃO VOLTAR */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/gestor/veiculos')} 
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Car size={14} /> Ficha do Veículo
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">{veiculo.placa}</h1>
          </div>
        </div>

        {/* CARD PRINCIPAL DO VEÍCULO */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Foto do Veículo */}
            <div className="w-full lg:w-1/3 aspect-video relative rounded-2xl overflow-hidden bg-[#070b3f] border border-white/10 shadow-2xl">
              <img 
                src={veiculo.image_url || DEFAULT_CAR_IMAGE} 
                alt={veiculo.modelo} 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${veiculo.ownership_type === 'proprio' ? 'bg-[#35c6cf]/90 text-white' : 'bg-[#6b63b5]/90 text-white'}`}>
                  {veiculo.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
                </span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${isAtivo ? 'bg-[#38a96a]/90 text-white' : 'bg-[#d9534f]/90 text-white'}`}>
                  {isAtivo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            {/* Informações (Grid) */}
            <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              
              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
                  <Car size={12} /> Veículo
                </p>
                <p className="text-xl font-black text-white truncate">{veiculo.placa}</p>
                <p className="text-sm font-medium text-slate-400 mt-1 truncate">{veiculo.modelo}</p>
              </div>

              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
                  <Settings2 size={12} /> Placa
                </p>
                <p className="text-xl font-black text-white mt-1">{veiculo.placa}</p>
              </div>

              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tipo</p>
                <p className="text-lg font-bold text-white capitalize mt-1">
                  {veiculo.ownership_type === 'proprio' ? 'Próprio' : 'Alugado'}
                </p>
              </div>

              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</p>
                <p className={`text-lg font-bold mt-1 ${isAtivo ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isAtivo ? 'Ativo' : 'Inativo'}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* HISTÓRICO DE INSPEÇÕES */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <History size={20} className="text-blue-400" /> Histórico de inspeções
              </h2>
              <p className="text-xs text-slate-400 mt-1">Registro cronológico de todas as vistorias deste veículo.</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-400">
              {inspecoes.length} inspeção(ões)
            </div>
          </div>

          <div className="mt-6">
            {inspecoes.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-12 flex flex-col items-center justify-center gap-3">
                <FileText size={32} className="text-slate-600" />
                <p className="text-sm text-slate-400">Nenhuma inspeção encontrada para este veículo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inspecoes.map((inspecao) => (
                  <div 
                    key={inspecao.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#070b3f] p-5 transition hover:border-[#2f6eea] hover:bg-white/5"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Inspeção de {new Date(inspecao.inspection_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Gauge size={12} /> {inspecao.odometer?.toLocaleString('pt-BR')} km
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} /> {inspecao.profiles?.nome || 'Técnico'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push(`/gestor/inspecoes/${inspecao.id}`)}
                      className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-[#2f6eea] hover:text-white hover:border-[#2f6eea]"
                    >
                      VER LAUDO
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}