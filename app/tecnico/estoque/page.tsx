'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Minus,
  Calendar,
  Save,
  Loader2,
  Cpu
} from 'lucide-react'

export default function ProducaoEstoquePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  
  // Dados do Lançamento
  const [modelo, setModelo] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [status, setStatus] = useState('Aprovado')
  const dataHoje = new Date().toLocaleDateString('pt-BR')

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  async function salvarProducao() {
    if (!modelo) return alert('Informe o modelo do equipamento!')
    if (quantidade <= 0) return alert('A quantidade deve ser maior que zero!')
    
    setEnviando(true)
    const { error } = await supabase.from('estoque_producao_diaria').insert([{
      modelo: modelo.toUpperCase().trim(),
      quantidade: quantidade,
      status: status,
      tecnico_id: user.id
    }])

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Lançamento realizado com sucesso!')
      setModelo('')
      setQuantidade(1)
    }
    setEnviando(false)
  }

  if (loading) return <div className="min-h-screen bg-[#02052b] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" /></div>

  return (
    <main className="min-h-screen bg-[#02052b] p-4 text-white">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* HEADER COM DATA */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Package size={14} /> Produção Diária
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Calendar size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold">{dataHoje}</span>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Bancada de Reuso</h1>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md space-y-6">
          
          {/* MODELO */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Modelo do Equipamento</label>
            <div className="relative">
              <input 
                type="text" 
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: ONU HG8245H, Roteador AX3..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 uppercase"
              />
              <Cpu className="absolute left-4 top-3.5 text-slate-500" size={18} />
            </div>
          </div>

          {/* QUANTIDADE COM CONTROLES */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase text-center block">Quantidade Testada</label>
            <div className="flex items-center justify-center gap-6">
              <button 
                type="button"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="text-4xl font-black min-w-[60px] text-center">{quantidade}</span>
              <button 
                type="button"
                onClick={() => setQuantidade(quantidade + 1)}
                className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* STATUS */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Aprovado', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { id: 'Defeito', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { id: 'Sucata', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                  status === item.id 
                    ? `${item.bg} border-white/20 ${item.color} scale-105` 
                    : 'bg-white/5 border-transparent text-slate-500 opacity-50'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[9px] font-black uppercase">{item.id}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={salvarProducao}
            disabled={enviando}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            {enviando ? <Loader2 className="animate-spin" /> : <><Save size={20} /> LANÇAR PRODUÇÃO</>}
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Logado como: {user?.email}
        </div>
      </div>
    </main>
  )
}