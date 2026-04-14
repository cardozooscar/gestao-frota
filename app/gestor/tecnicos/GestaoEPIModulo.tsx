'use client'

import { useState, useEffect } from 'react'
import { Unlock, Lock, Eye, FileText, User, Package, Calendar, Image as ImageIcon } from 'lucide-react'
// IMPORT CORRIGIDO: Usando a sua conexão oficial
import { supabase } from '../../../lib/supabase'

type Request = {
  id: string
  items: any
  photo_url: string
  signature_url: string
  created_at: string
}

export default function GestaoEPIModulo({ technicianId }: { technicianId: string }) {
  
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

  useEffect(() => {
    fetchData()
  }, [technicianId])

  async function fetchData() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('epi_unlocked')
      .eq('id', technicianId)
      .single()
    
    if (profile) setIsUnlocked(profile.epi_unlocked)

    const { data: epiData } = await supabase
      .from('epi_requests')
      .select('*')
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false })

    if (epiData) setRequests(epiData)
    setLoading(false)
  }

  async function toggleUnlock() {
    setToggling(true)
    const nextState = !isUnlocked
    
    const { error } = await supabase
      .from('profiles')
      .update({ epi_unlocked: nextState })
      .eq('id', technicianId)

    if (!error) setIsUnlocked(nextState)
    setToggling(false)
  }

  if (loading) return <div className="animate-pulse text-slate-500">Sincronizando dados...</div>

  return (
    <div className="space-y-6">
      
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Acesso à Aba de Materiais</h3>
              <p className="text-sm text-slate-400">
                {isUnlocked ? 'O técnico pode preencher o formulário agora.' : 'A aba está bloqueada para o técnico.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleUnlock}
            disabled={toggling}
            className={`relative inline-flex h-12 items-center justify-center rounded-xl px-6 font-bold transition-all active:scale-95 ${
              isUnlocked 
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' 
              : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500'
            }`}
          >
            {toggling ? 'Processando...' : isUnlocked ? 'Bloquear Agora' : 'Liberar Acesso'}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-widest pl-2">
          <FileText size={16} /> Histórico de Recebimento
        </h3>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-slate-500 italic text-sm">
            Nenhum registro de fardamento ou EPI assinado ainda.
          </div>
        ) : (
          requests.map((req) => (
            <div 
              key={req.id} 
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#070b3f]/40 transition-all hover:border-blue-500/50"
            >
              <div 
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Solicitação Documentada</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(req.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400 uppercase">Assinado</span>
                  <Eye size={18} className={`transition-colors ${selectedRequest?.id === req.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`} />
                </div>
              </div>

              {selectedRequest?.id === req.id && (
                <div className="border-t border-white/10 bg-black/30 p-6 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div>
                      <h4 className="mb-4 text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">Materiais Entregues</h4>
                      <div className="space-y-2">
                        {Object.entries(req.items).map(([nome, info]: any) => (
                          <div key={nome} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 border border-white/5">
                            <span className="text-slate-200 font-medium">{nome}</span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-slate-400">Qtd: <b className="text-white">{info.qtd}</b></span>
                              <span className="text-slate-400">Tam: <b className="text-white">{info.tam || '-'}</b></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                          <User size={12} /> Identificação
                        </h4>
                        <div className="aspect-square rounded-2xl border border-white/10 bg-black/40 overflow-hidden ring-4 ring-white/5">
                          <img src={req.photo_url} alt="Identificação do Técnico" className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                          <ImageIcon size={12} /> Assinatura Digital
                        </h4>
                        <div className="aspect-square rounded-2xl border border-white/10 bg-white p-3 flex items-center justify-center">
                          <img src={req.signature_url} alt="Assinatura" className="max-h-full max-w-full object-contain grayscale" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}