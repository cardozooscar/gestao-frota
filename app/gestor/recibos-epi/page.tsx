'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, Calendar, User, Package, X, FileText, Camera, PenTool } from 'lucide-react'

type EpiRequest = {
  id: string
  created_at: string
  items: any
  photo_url: string
  signature_url: string
  profiles: { nome: string } | null
}

export default function RecibosEPIPage() {
  const [recibos, setRecibos] = useState<EpiRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecibo, setSelectedRecibo] = useState<EpiRequest | null>(null)

  useEffect(() => {
    fetchRecibos()
  }, [])

  async function fetchRecibos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('epi_requests')
        .select(`*, profiles:technician_id ( nome )`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecibos(data as EpiRequest[])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (iso: string) => {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#02052b] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER PADRÃO FIBRANET */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            <FileText size={14} /> Logística
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Central de Recibos</h1>
          <p className="text-sm text-slate-400">Histórico documentado de EPI e Materiais.</p>
        </div>

        {/* LISTAGEM EM GRID DARK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recibos.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl text-slate-500">
              Nenhum recibo assinado até o momento.
            </div>
          ) : (
            recibos.map((recibo) => (
              <div 
                key={recibo.id}
                onClick={() => setSelectedRecibo(recibo)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-blue-500/50 hover:bg-white/[0.07] cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Package size={20} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                    #{recibo.id.slice(0, 5)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{recibo.profiles?.nome || 'Técnico'}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar size={12} /> {formatarData(recibo.created_at)}
                </p>

                <div className="mt-6 flex items-center justify-between text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <span>Ver Detalhes</span>
                  <Eye size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DARK - IDENTIDADE VISUAL DO SISTEMA */}
      {selectedRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#070b3f] w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white">Recibo de Entrega</h2>
              <button onClick={() => setSelectedRecibo(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-8">
              
              {/* TABELA DE ITENS */}
              <div>
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-3">Materiais Retirados</h4>
                <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-right">Tamanho</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {Object.entries(selectedRecibo.items).map(([nome, dados]: any) => (
                        <tr key={nome} className="border-t border-white/5">
                          <td className="px-4 py-3 font-medium text-white">{nome}</td>
                          <td className="px-4 py-3 text-center">{dados.qtd}</td>
                          <td className="px-4 py-3 text-right uppercase">{dados.tam || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOTOS E COMPROVAÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Camera size={14} /> Selfie de Identificação
                  </h4>
                  <div className="aspect-square rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative group">
                    {selectedRecibo.photo_url.includes('url_da_foto') ? (
                      <span className="text-[10px] text-slate-600 font-bold italic">RECIBO DE TESTE (SEM FOTO)</span>
                    ) : (
                      <img 
                        src={selectedRecibo.photo_url} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        alt="Selfie"
                        onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400?text=Erro+no+Link")}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <PenTool size={14} /> Assinatura Digital
                  </h4>
                  <div className="aspect-square md:aspect-auto md:h-full rounded-2xl bg-white flex items-center justify-center p-4 border-4 border-white/5 shadow-inner">
                    {selectedRecibo.signature_url.includes('url_da_assinatura') ? (
                      <span className="text-[10px] text-slate-400 font-bold italic">SEM ASSINATURA</span>
                    ) : (
                      <img 
                        src={selectedRecibo.signature_url} 
                        className="max-w-full max-h-full object-contain grayscale" 
                        alt="Assinatura" 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-center">
               <p className="text-[10px] text-slate-500 font-medium">Recibo gerado digitalmente pelo Sistema de Gestão de Frota - Fibranet Brasil</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}