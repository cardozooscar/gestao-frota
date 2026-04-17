'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Package, CheckCircle2, AlertTriangle, 
  Plus, Minus, Save, Loader2, Cpu, History, LogOut
} from 'lucide-react'

// Atalhos baseados no seu estoque real
const MODELOS_COMUNS = [
  'HUAWEI V2', 
  'HUAWEI V5', 
  'ONU BRIDGE', 
  'XSRIUS', 
  'TP-LINK', 
  'ZTE'
]

export default function ProducaoEstoquePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  
  const [modelo, setModelo] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [status, setStatus] = useState('Aprovado')
  const [meuTotalHoje, setMeuTotalHoje] = useState(0)
  const [ultimosTestes, setUltimosTestes] = useState<any[]>([])

  const dataHojeStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) fetchMeuProgresso(user.id)
      setLoading(false)
    }
    loadData()
  }, [])

  async function fetchMeuProgresso(userId: string) {
    // Totalizador de hoje para o técnico
    const { data: total } = await supabase
      .from('estoque_producao_diaria')
      .select('quantidade')
      .eq('tecnico_id', userId)
      .eq('data_referencia', dataHojeStr)

    const soma = total?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0
    setMeuTotalHoje(soma)

    // Histórico para conferência imediata
    const { data: lista } = await supabase
      .from('estoque_producao_diaria')
      .select('*')
      .eq('tecnico_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (lista) setUltimosTestes(lista)
  }

  async function salvarProducao() {
    if (!modelo) return alert('Selecione ou digite o modelo!')
    setEnviando(true)

    const { error } = await supabase.from('estoque_producao_diaria').insert([{
      modelo: modelo.toUpperCase().trim(),
      quantidade: quantidade,
      status: status,
      tecnico_id: user.id,
      data_referencia: dataHojeStr
    }])

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setModelo('')
      setQuantidade(1)
      fetchMeuProgresso(user.id)
    }
    setEnviando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#02052b] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <main className="min-h-screen bg-[#02052b] p-4 text-white pb-10">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* HEADER COM LOGOUT */}
        <div className="flex items-center justify-between pt-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Package size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Fibranet</p>
              <h1 className="text-sm font-bold text-white leading-tight">Bancada de Testes</h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500 px-3 py-2 rounded-lg transition-all border border-red-500/20 active:scale-95"
          >
            Sair <LogOut size={14} />
          </button>
        </div>

        {/* INDICADOR DE PERFORMANCE DIÁRIA */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-6 rounded-[2rem] shadow-xl shadow-blue-950/50 border border-white/10 mt-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/70 mb-1">Produção do Turno</p>
              <h2 className="text-6xl font-black tracking-tighter">{meuTotalHoje}</h2>
            </div>
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
              <Package className="text-white" size={24} />
            </div>
          </div>
          <p className="mt-2 text-xs font-bold text-blue-200">Equipamentos validados hoje</p>
        </div>

        {/* ÁREA DE LANÇAMENTO */}
        <div className="bg-[#070b3f] p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-6">
          
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selecione o Equipamento</label>
            
            {/* GRID DE MODELOS RÁPIDOS */}
            <div className="grid grid-cols-3 gap-2">
              {MODELOS_COMUNS.map(m => (
                <button 
                  key={m}
                  onClick={() => setModelo(m)}
                  className={`py-3 rounded-xl text-[9px] font-black border transition-all ${
                    modelo === m 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="relative pt-2">
              <div className="absolute left-4 top-[22px] text-slate-500">
                <Cpu size={16} />
              </div>
              <input 
                type="text" 
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="OUTRO MODELO..."
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 pl-12 text-xs font-bold focus:border-blue-500 outline-none uppercase transition-all"
              />
            </div>
          </div>

          {/* AJUSTE DE QUANTIDADE */}
          <div className="bg-black/40 rounded-3xl p-2 border border-white/5">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
              >
                <Minus size={20} />
              </button>
              
              <div className="text-center">
                <span className="text-4xl font-black block leading-none">{quantidade}</span>
                <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter">Unidades</span>
              </div>

              <button 
                onClick={() => setQuantidade(quantidade + 1)}
                className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 shadow-lg shadow-blue-600/30 active:scale-90 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* STATUS DO LOTE */}
          <div className="flex gap-2">
            {['Aprovado', 'Defeito', 'Sucata'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                  status === s 
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                  : 'bg-transparent border-transparent text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button 
            onClick={salvarProducao}
            disabled={enviando}
            className="w-full bg-white text-[#02052b] font-black py-5 rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {enviando ? <Loader2 className="animate-spin" /> : <><Save size={20} /> FINALIZAR LOTE</>}
          </button>
        </div>

        {/* FEEDBACK DE HISTÓRICO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <History size={14} /> Últimos Lançamentos
            </h4>
          </div>
          
          <div className="space-y-2">
            {ultimosTestes.length === 0 ? (
              <p className="text-center py-4 text-[10px] text-slate-600 italic">Nenhum teste registrado hoje.</p>
            ) : (
              ultimosTestes.map(t => (
                <div key={t.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${t.status === 'Aprovado' ? 'bg-emerald-500' : t.status === 'Defeito' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white">{t.modelo}</p>
                      <p className="text-[9px] text-slate-500 font-medium">{new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-400">x{t.quantidade}</p>
                    <p className={`text-[8px] font-bold uppercase tracking-tighter ${t.status === 'Aprovado' ? 'text-emerald-500' : 'text-amber-500'}`}>{t.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  )
}