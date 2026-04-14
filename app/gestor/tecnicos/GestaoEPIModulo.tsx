'use client'

import { useState, useEffect } from 'react'
import { Unlock, Lock, Eye, FileText, User, Package, Calendar, Image as ImageIcon } from 'lucide-react'
// IMPORTANTE: Usando a sua conexão oficial que já funciona no resto do sistema
import { supabase } from '@/lib/supabase' 

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
    if (toggling) return
    setToggling(true)
    
    const nextState = !isUnlocked

    // Tentativa de update com log de erro para debug
    const { data, error } = await supabase
      .from('profiles')
      .update({ epi_unlocked: nextState })
      .eq('id', technicianId)
      .select()

    if (error) {
      console.error('Erro detalhado do Supabase:', error)
      alert('Erro ao salvar no banco: ' + error.message)
    } else {
      console.log('Sucesso ao atualizar:', data)
      setIsUnlocked(nextState)
    }
    
    setToggling(false)
  }

  if (loading) return <div className="animate-pulse text-slate-500 text-xs">Sincronizando...</div>

  return (
    <div className="space-y-4">
      {/* CARD DE CONTROLE */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isUnlocked ? <Unlock size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Acesso do Técnico</p>
              <p className="text-[10px] text-slate-400">{isUnlocked ? 'Liberado' : 'Bloqueado'}</p>
            </div>
          </div>
          
          <button
            onClick={toggleUnlock}
            disabled={toggling}
            className={`h-10 rounded-lg px-4 text-xs font-black transition-all active:scale-95 ${
              isUnlocked 
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' 
              : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {toggling ? 'AGUARDE...' : isUnlocked ? 'BLOQUEAR' : 'LIBERAR'}
          </button>
        </div>
      </div>

      {/* LISTA DE PEDIDOS (RESUMIDA) */}
      <div className="space-y-2">
        {requests.length > 0 && requests.map((req) => (
          <div key={req.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-blue-400" />
                <span className="text-[10px] text-slate-300">{new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <button onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)} className="text-[10px] text-blue-400 font-bold uppercase">Ver Recibo</button>
            </div>
            
            {selectedRequest?.id === req.id && (
              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    {Object.entries(req.items).map(([nome, info]: any) => (
                      <p key={nome} className="text-[9px] text-slate-300">
                        • {nome} ({info.qtd}) - Tam: {info.tam}
                      </p>
                    ))}
                 </div>
                 <div className="flex gap-2">
                    <img src={req.photo_url} className="w-10 h-10 rounded bg-black object-cover" alt="Foto" />
                    <img src={req.signature_url} className="w-10 h-10 rounded bg-white object-contain" alt="Assinatura" />
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}