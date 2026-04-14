'use client'

import { useState, useEffect } from 'react'
import { Unlock, Lock, Eye, FileText, User, Package, Calendar, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

type Request = {
  id: string
  items: any
  photo_url: string
  signature_url: string
  created_at: string
}

export default function GestaoEPIModulo({ technicianId }: { technicianId: string }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

  useEffect(() => {
    fetchData()
  }, [technicianId])

  async function fetchData() {
    // 1. Busca o status da trava
    const { data: profile } = await supabase
      .from('profiles')
      .select('epi_unlocked')
      .eq('id', technicianId)
      .single()
    
    if (profile) setIsUnlocked(profile.epi_unlocked)

    // 2. Busca o histórico de solicitações
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
      
      {/* CARD DE CONTROLE DE ACESSO */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 ${isUnlocked ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Acesso à Aba de Materiais</h3>
              <p className="text-sm text-slate-400">
                {isUnlocked ? 'O técnico pode preencher o formulário agora.' : 'A aba está oculta para o técnico.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleUnlock}
            disabled={toggling}
            className={`relative inline-flex h-12 items-center rounded-xl px-6 font-bold transition-all active:scale-95 ${
              isUnlocked 
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' 
              : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500'
            }`}
          >
            {toggling ? 'Processando...' : isUnlocked ? 'Bloquear Agora' : 'Liberar Acesso'}
          </button>
        </div>
      </div>

      {/* LISTA DE SOLICITAÇÕES RECEBIDAS */}
      <div className="grid gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-widest">
          <FileText size={16} /> Histórico de Recebimento
        </h3>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500 italic text-sm">
            Nenhuma solicitação assinada encontrada para este técnico.
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
                    <p className="font-bold text-white">Solicitação de Itens</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(req.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400 uppercase">Documentado</span>
                  <Eye size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>

              {/* DETALHES EXPANSÍVEIS */}
              {selectedRequest?.id === req.id && (
                <div className="border-t border-white/10 bg-black/20 p-6 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Lista de Itens */}
                    <div>
                      <h4 className="mb-3 text-xs font-bold text-blue-400 uppercase tracking-tighter">Itens Entregues</h4>
                      <div className="space-y-2">
                        {Object.entries(req.items).map(([nome, info]: any) => (
                          <div key={nome} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2 text-sm">
                            <span className="text-white">{nome}</span>
                            <span className="font-mono text-blue-300">Qtd: {info.qtd} | Tam: {info.tam}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Provas Digitais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="mb-3 text-xs font-bold text-blue-400 uppercase tracking-tighter flex items-center gap-1">
                          <User size={12} /> Validação (Foto)
                        </h4>
                        <div className="aspect-square rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                          {/* Substitua pela URL real do seu bucket do Supabase */}
                          <img src={req.photo_url} alt="Selfie" className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-3 text-xs font-bold text-blue-400 uppercase tracking-tighter flex items-center gap-1">
                          <ImageIcon size={12} /> Assinatura
                        </h4>
                        <div className="aspect-square rounded-xl border border-white/10 bg-white p-2">
                          <img src={req.signature_url} alt="Assinatura" className="h-full w-full object-contain grayscale" />
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