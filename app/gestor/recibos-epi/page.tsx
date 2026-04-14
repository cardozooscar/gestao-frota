'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, Calendar, User, Package, X, FileText } from 'lucide-react'

// Tipagem unindo o recibo com o nome do técnico (JOIN Profiles)
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
        .select(`
          *,
          profiles:technician_id ( nome )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const recibosProcessados = data as EpiRequest[];
      setRecibos(recibosProcessados)
      
      // LOG DE AJUDA: Isso vai nos dizer o que está vindo do banco
      console.log('Recibos carregados do banco (primeiro item):', recibosProcessados[0]);

    } catch (error) {
      console.error('Erro ao buscar recibos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função nativa para formatar data de forma compacta (ex: 14/04/2026, 16:59)
  const formatarDataLocalCompacta = (dataIso: string) => {
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <p className="text-slate-500 animate-pulse text-sm">Sincronizando com a Fibranet...</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Package size={14} /> Logística
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Central de Recibos</h1>
            <p className="mt-2 text-sm text-slate-400">Histórico documentado de entregas de fardamento e EPI.</p>
          </div>
      </div>

      {/* LISTAGEM DE CARDS (Simplified e clean) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recibos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-slate-500 italic text-sm">
             Nenhum recibo assinado foi encontrado ainda.
          </div>
        ) : (
          recibos.map((recibo) => (
            <div 
              key={recibo.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
              onClick={() => setSelectedRecibo(recibo)}
            >
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                  <Package size={22} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full text-slate-500 border border-slate-200 shadow-inner">
                    EPI-#{recibo.id.slice(0, 5)}
                  </span>
                  <p className="text-xs text-slate-500 mt-2">{formatarDataLocalCompacta(recibo.created_at)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-800 font-extrabold text-base">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
                    <User size={16} />
                  </div>
                  {recibo.profiles?.nome || 'Técnico'}
                </div>
              </div>

              <button className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition hover:scale-[1.01] shadow-md shadow-blue-500/30">
                <Eye size={18} /> Visualizar Detalhes
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE DETALHES - Revertido para o visual original da imagem (image_10.png) */}
      {selectedRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
            {/* Header simples do modal */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Recibo Assinado</h2>
              <button onClick={() => setSelectedRecibo(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={24} />
              </button>
            </div>

            {/* Corpo do Modal com scroll */}
            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-8">
              {/* ITENS SOLICITADOS - Tabela compacta */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Materiais Entregues</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                        <th className="pb-2 font-bold px-4 pt-3">Item</th>
                        <th className="pb-2 text-center font-bold px-4 pt-3">Qtd</th>
                        <th className="pb-2 text-right font-bold px-4 pt-3">Tam</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {Object.entries(selectedRecibo.items).map(([nome, dados]: any) => (
                        <tr key={nome} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 font-medium px-4">{nome}</td>
                          <td className="py-2.5 text-center px-4">{dados.qtd}</td>
                          <td className="py-2.5 text-right uppercase px-4">{dados.tam || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOTOS E COMPROVAÇÃO - Caixas cinzas limpas (Exatamente como a imagem mandada) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Selfie do Técnico</h3>
                  <div className="aspect-square rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center p-2 text-center shadow-inner">
                    {/* TENTATIVA 2 DO FIX DO ERRO: Fallback simples */}
                    <img
                      src={selectedRecibo.photo_url}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Falha ao carregar selfie:", selectedRecibo.photo_url);
                        (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Erro+no+Link';
                        (e.currentTarget as HTMLImageElement).title = 'Link incorreto no banco de dados';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Assinatura Digital</h3>
                  <div className="aspect-square md:aspect-[4/1] rounded-xl bg-white border border-slate-300 flex items-center justify-center p-4 shadow-inner">
                     <img
                      src={selectedRecibo.signature_url}
                      alt="Assinatura"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        console.error("Falha ao carregar assinatura:", selectedRecibo.signature_url);
                        (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x100?text=Erro+no+Link';
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}