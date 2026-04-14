'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  User, 
  PenTool, 
  Camera, 
  X, 
  Search,
  Clock
} from 'lucide-react'

type EpiRequest = {
  id: string
  created_at: string
  items: any
  photo_url: string
  signature_url: string
  profiles: { nome: string } | null
}

export default function RecibosEPIPage() {
  const [dataAtual, setDataAtual] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [recibosMes, setRecibosMes] = useState<EpiRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecibo, setSelectedRecibo] = useState<EpiRequest | null>(null)

  useEffect(() => {
    fetchRecibosDoMes()
  }, [dataAtual.getMonth(), dataAtual.getFullYear()])

  async function fetchRecibosDoMes() {
    setLoading(true)
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()
    
    const primeiroDia = new Date(ano, mes, 1).toISOString()
    const ultimoDia = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('epi_requests')
      .select('*, profiles:technician_id(nome)')
      .gte('created_at', primeiroDia)
      .lte('created_at', ultimoDia)
      .order('created_at', { ascending: false })

    if (data) setRecibosMes(data as EpiRequest[])
    setLoading(false)
  }

  const prevMonth = () => setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1))
  const nextMonth = () => setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1))

  const diasNoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate()
  const primeiroDiaDoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).getDay()
  
  const diasEmBranco = Array.from({ length: primeiroDiaDoMes })
  const diasDoMes = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  const formatarDataFiltro = (dia: number) => {
    const ano = dataAtual.getFullYear()
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0')
    const diaFormatado = String(dia).padStart(2, '0')
    return `${ano}-${mes}-${diaFormatado}`
  }

  const recibosDoDia = recibosMes.filter(req => {
    if (!diaSelecionado) return false
    return req.created_at.startsWith(diaSelecionado)
  })

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            <CalendarIcon size={14} /> Histórico Digital
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Central de Recibos</h1>
          <p className="text-sm text-slate-400">Navegue pelas entregas de EPI e materiais por data.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: O CALENDÁRIO DARK */}
          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md h-fit">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3 text-center text-[10px] font-black text-slate-500">
              <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SAB</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {diasEmBranco.map((_, i) => (
                <div key={`blank-${i}`} className="h-10 rounded-xl bg-transparent" />
              ))}
              
              {diasDoMes.map(dia => {
                const dataFormatada = formatarDataFiltro(dia)
                const temRecibo = recibosMes.some(req => req.created_at.startsWith(dataFormatada))
                const isSelecionado = diaSelecionado === dataFormatada

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSelecionado(dataFormatada)}
                    className={`relative flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isSelecionado 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110 z-10' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {dia}
                    {temRecibo && !isSelecionado && (
                      <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-blue-400 animate-pulse"></span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* COLUNA DIREITA: RESULTADOS DO DIA */}
          <div className="lg:col-span-2 space-y-4">
            {!diaSelecionado ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/5 text-slate-500">
                <Search size={32} className="mb-4 opacity-20" />
                <p className="text-sm">Selecione uma data para visualizar os recibos.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                   Entregas em {diaSelecionado.split('-').reverse().join('/')}
                </h3>

                {recibosDoDia.length === 0 ? (
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center text-slate-500 italic text-sm">
                    Nenhum material foi entregue nesta data.
                  </div>
                ) : (
                  recibosDoDia.map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => setSelectedRecibo(req)}
                      className="group flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{req.profiles?.nome || 'Técnico'}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold tracking-tighter">
                            <Clock size={10} /> {new Date(req.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">ASSINADO</span>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES (DARK FIBRANET) */}
      {selectedRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#070b3f] w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white">Detalhamento do Recibo</h2>
              <button onClick={() => setSelectedRecibo(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Materiais Entregues</h4>
                <div className="rounded-2xl border border-white/5 bg-black/30 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white/5 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="px-4 py-3">Descrição do Material</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-right">Tam.</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {Object.entries(selectedRecibo.items).map(([nome, info]: any) => (
                        <tr key={nome} className="border-t border-white/5">
                          <td className="px-4 py-3 font-medium text-white">{nome}</td>
                          <td className="px-4 py-3 text-center">{info.qtd}</td>
                          <td className="px-4 py-3 text-right uppercase">{info.tam || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={12} /> Comprovação Visual
                  </h4>
                  <div className="aspect-square rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                    {selectedRecibo.photo_url.includes('url_da_foto') ? (
                       <span className="text-[10px] text-slate-600 italic">RECIBO DE TESTE</span>
                    ) : (
                      <img src={selectedRecibo.photo_url} className="w-full h-full object-cover" alt="Selfie" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <PenTool size={12} /> Assinatura Coletada
                  </h4>
                  <div className="aspect-square md:aspect-auto md:h-full rounded-2xl bg-white flex items-center justify-center p-4">
                    {selectedRecibo.signature_url.includes('url_da_assinatura') ? (
                       <span className="text-[10px] text-slate-400 italic">SEM ASSINATURA</span>
                    ) : (
                      <img src={selectedRecibo.signature_url} className="max-w-full max-h-full object-contain grayscale" alt="Assinatura" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}