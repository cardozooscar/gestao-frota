'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, Calendar, User, Package, X } from 'lucide-react'

export default function RecibosEPIPage() {
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecibo, setSelectedRecibo] = useState<any>(null)

  useEffect(() => {
    fetchRecibos()
  }, [])

  async function fetchRecibos() {
    try {
      const { data, error } = await supabase
        .from('epi_requests')
        .select(`
          *,
          profiles:technician_id ( nome )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecibos(data || [])
    } catch (error) {
      console.error('Erro ao buscar recibos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <p className="text-slate-500 animate-pulse">Carregando recibos de EPI...</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Recibos de EPI</h1>
        <p className="text-sm text-slate-500">Histórico de entregas e assinaturas digitais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recibos.map((recibo) => (
          <div 
            key={recibo.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedRecibo(recibo)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="text-blue-600" size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded text-slate-500">
                #{recibo.id.slice(0, 8)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <User size={16} className="text-slate-400" />
                {recibo.profiles?.nome || 'Técnico não identificado'}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar size={16} className="text-slate-400" />
                {format(new Date(recibo.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
              </div>
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-lg transition">
              <Eye size={16} /> Visualizar Recibo
            </button>
          </div>
        ))}
      </div>

      {/* MODAL DE DETALHES */}
      {selectedRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Detalhes do Recibo</h2>
              <button onClick={() => setSelectedRecibo(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* ITENS SOLICITADOS */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Materiais Entregues</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="pb-2">Item</th>
                        <th className="pb-2 text-center">Qtd</th>
                        <th className="pb-2 text-right">Tam</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {Object.entries(selectedRecibo.items).map(([nome, dados]: any) => (
                        <tr key={nome} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 font-medium">{nome}</td>
                          <td className="py-2 text-center">{dados.qtd}</td>
                          <td className="py-2 text-right uppercase">{dados.tam || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOTOS E COMPROVAÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Selfie do Técnico</h3>
                  <div className="aspect-square rounded-xl bg-slate-200 border border-slate-200 overflow-hidden shadow-inner">
                    <img 
                      src={selectedRecibo.photo_url} 
                      alt="Selfie" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Erro+ao+carregar+foto';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assinatura Digital</h3>
                  <div className="aspect-square md:aspect-auto md:h-[calc(100%-1.5rem)] rounded-xl bg-white border border-slate-200 flex items-center justify-center p-4 shadow-inner">
                    <img 
                      src={selectedRecibo.signature_url} 
                      alt="Assinatura" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x200/ffffff/64748b?text=Erro+na+Assinatura';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 text-center">
              <button 
                onClick={() => window.print()}
                className="text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Imprimir Comprovante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}