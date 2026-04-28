'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Package, CheckCircle2, AlertTriangle, 
  Plus, Minus, Save, Loader2, Cpu, History, LogOut, Barcode, MessageSquareWarning, Trophy, Target
} from 'lucide-react'

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
  const [sn, setSn] = useState('')
  const [defeitoRelatado, setDefeitoRelatado] = useState('')
  
  const [meuTotalHoje, setMeuTotalHoje] = useState(0)
  const [metaDiaria, setMetaDiaria] = useState(30) // Estado da Meta
  const [ultimosTestes, setUltimosTestes] = useState<any[]>([])

  const dataHojeStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchMeuProgresso(user.id)
        fetchMinhaMeta(user.id)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Busca a meta definida pelo Gestor no perfil do usuário
  async function fetchMinhaMeta(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('meta_diaria')
      .eq('id', userId)
      .single()
      
    if (profile?.meta_diaria) {
      setMetaDiaria(profile.meta_diaria)
    }
  }

  async function fetchMeuProgresso(userId: string) {
    const { data: total } = await supabase
      .from('estoque_producao_diaria')
      .select('quantidade')
      .eq('tecnico_id', userId)
      .eq('data_referencia', dataHojeStr)

    const soma = total?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0
    setMeuTotalHoje(soma)

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
      serial_number: sn.trim() || null,
      defeito_relatado: defeitoRelatado.trim() || null,
      tecnico_id: user.id,
      data_referencia: dataHojeStr
    }])

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setModelo('')
      setQuantidade(1)
      setSn('')
      setDefeitoRelatado('')
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

  // Cálculos da Meta
  const percentualMeta = metaDiaria > 0 ? Math.min(Math.round((meuTotalHoje / metaDiaria) * 100), 100) : 0
  const bateuMeta = meuTotalHoje >= metaDiaria

  return (
    <main className="min-h-screen bg-[#02052b] p-4 text-white pb-10">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* HEADER */}
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
          <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500 px-3 py-2 rounded-lg transition-all border border-red-500/20 active:scale-95">
            Sair <LogOut size={14} />
          </button>
        </div>

        {/* INDICADOR DE PERFORMANCE COM META */}
        <div className={`p-6 rounded-[2rem] shadow-xl border mt-2 transition-all duration-700 ${
          bateuMeta 
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-900 shadow-emerald-900/50 border-emerald-500/30' 
            : 'bg-gradient-to-br from-blue-600 to-indigo-900 shadow-blue-950/50 border-white/10'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${bateuMeta ? 'text-emerald-200' : 'text-blue-200/70'}`}>
                {bateuMeta ? 'Meta Alcançada! 🎉' : 'Produção do Turno'}
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-6xl font-black tracking-tighter">{meuTotalHoje}</h2>
                <span className={`text-sm font-bold ${bateuMeta ? 'text-emerald-300' : 'text-blue-300'}`}>/ {metaDiaria}</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl backdrop-blur-md transition-colors ${bateuMeta ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-white'}`}>
              {bateuMeta ? <Trophy size={28} /> : <Target size={28} />}
            </div>
          </div>
          
          {/* Barra de Progresso */}
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className={bateuMeta ? 'text-emerald-100' : 'text-blue-200'}>Progresso</span>
              <span className={bateuMeta ? 'text-emerald-100' : 'text-blue-200'}>{percentualMeta}%</span>
            </div>
            <div className={`h-2.5 w-full rounded-full overflow-hidden ${bateuMeta ? 'bg-emerald-950/50' : 'bg-black/30'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${bateuMeta ? 'bg-emerald-300' : 'bg-[#2f6eea]'}`}
                style={{ width: `${percentualMeta}%` }}
              />
            </div>
          </div>
        </div>

        {/* ÁREA DE LANÇAMENTO */}
        <div className="bg-[#070b3f] p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selecione o Equipamento</label>
            <div className="grid grid-cols-3 gap-2">
              {MODELOS_COMUNS.map(m => (
                <button key={m} onClick={() => setModelo(m)} className={`py-3 rounded-xl text-[9px] font-black border transition-all ${modelo === m ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="relative pt-2">
              <div className="absolute left-4 top-[22px] text-slate-500"><Cpu size={16} /></div>
              <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="OUTRO MODELO..." className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 pl-12 text-xs font-bold focus:border-blue-500 outline-none uppercase transition-all" />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Serial Number (SN)</label>
            <div className="relative">
              <div className="absolute left-4 top-[18px] text-slate-500"><Barcode size={16} /></div>
              <input type="text" value={sn} onChange={(e) => setSn(e.target.value.toUpperCase())} placeholder="DIGITE O SN DO EQUIPAMENTO..." className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 pl-12 text-xs font-bold focus:border-blue-500 outline-none uppercase transition-all" />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Defeito Relatado / Observação</label>
            <div className="relative">
              <div className="absolute left-4 top-[18px] text-slate-500"><MessageSquareWarning size={16} /></div>
              <input type="text" value={defeitoRelatado} onChange={(e) => setDefeitoRelatado(e.target.value)} placeholder="Ex: Porta PON queimada, sem sinal..." className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 pl-12 text-xs focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" />
            </div>
          </div>

          <div className="bg-black/40 rounded-3xl p-2 border border-white/5 mt-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"><Minus size={20} /></button>
              <div className="text-center">
                <span className="text-4xl font-black block leading-none">{quantidade}</span>
                <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter">Unidades</span>
              </div>
              <button onClick={() => setQuantidade(quantidade + 1)} className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 shadow-lg shadow-blue-600/30 active:scale-90 transition-all"><Plus size={20} /></button>
            </div>
          </div>

          <div className="flex gap-2">
            {['Aprovado', 'Defeito', 'Sucata'].map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${status === s ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-transparent border-transparent text-slate-600'}`}>{s}</button>
            ))}
          </div>

          <button onClick={salvarProducao} disabled={enviando} className="w-full bg-white text-[#02052b] font-black py-5 rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">
            {enviando ? <Loader2 className="animate-spin" /> : <><Save size={20} /> FINALIZAR LOTE</>}
          </button>
        </div>

        {/* FEEDBACK DE HISTÓRICO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14} /> Últimos Lançamentos</h4>
          </div>
          <div className="space-y-2">
            {ultimosTestes.length === 0 ? (
              <p className="text-center py-4 text-[10px] text-slate-600 italic">Nenhum teste registrado hoje.</p>
            ) : (
              ultimosTestes.map(t => (
                <div key={t.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-full min-h-[32px] rounded-full ${t.status === 'Aprovado' ? 'bg-emerald-500' : t.status === 'Defeito' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white">{t.modelo}</p>
                      {t.serial_number && <p className="text-[9px] font-mono text-blue-400 font-bold mt-0.5">SN: {t.serial_number}</p>}
                      {t.defeito_relatado && <p className="text-[9px] text-slate-400 italic mt-0.5 truncate max-w-[150px]">Obs: {t.defeito_relatado}</p>}
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">{new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
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