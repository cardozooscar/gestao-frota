'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, CheckCircle2, AlertTriangle, TrendingUp, 
  Search, Cpu, Pencil, Trash2, X, Save, Loader2,
  CalendarDays, Trophy, BarChart3, Activity, Barcode, Target, User
} from 'lucide-react'

type Producao = {
  id: string
  created_at: string
  data_referencia?: string
  modelo: string
  quantidade: number
  status: 'Aprovado' | 'Defeito' | 'Sucata'
  serial_number?: string
  defeito_relatado?: string
  tecnico_id: string
  profiles: { nome: string; meta_diaria?: number } | null
}

export default function GestaoEstoquePage() {
  const [dados, setDados] = useState<Producao[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroModelo, setFiltroModelo] = useState('')
  const [buscaSN, setBuscaSN] = useState('')
  
  // Estados para Edição
  const [editando, setEditando] = useState<Producao | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Datas Base
  const hoje = new Date()
  const dataHojeStr = hoje.toISOString().split('T')[0]
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  useEffect(() => {
    fetchProducao()
  }, [])

  async function fetchProducao() {
    setLoading(true)
    const { data, error } = await supabase
      .from('estoque_producao_diaria')
      .select('*, profiles:tecnico_id(nome, meta_diaria)') // Buscando a meta do perfil
      .order('created_at', { ascending: false })

    if (data) setDados(data as Producao[])
    setLoading(false)
  }

  /* ==========================================
     LÓGICA DE ACOMPANHAMENTO DE METAS (HOJE)
     ========================================== */
  const resumoMetasHoje = useMemo(() => {
    const recordsHoje = dados.filter(d => (d.data_referencia || d.created_at.split('T')[0]) === dataHojeStr)
    const progresso: Record<string, { nome: string; total: number; meta: number }> = {}

    recordsHoje.forEach(r => {
      const id = r.tecnico_id
      if (!progresso[id]) {
        progresso[id] = { 
          nome: r.profiles?.nome || 'Desconhecido', 
          total: 0, 
          meta: r.profiles?.meta_diaria || 30 
        }
      }
      progresso[id].total += r.quantidade
    })

    return Object.values(progresso)
  }, [dados, dataHojeStr])

  /* ==========================================
     OUTRAS LÓGICAS (GRÁFICOS E CALENDÁRIO)
     ========================================== */
  const totalAprovados = dados.filter(d => d.status === 'Aprovado').reduce((acc, curr) => acc + curr.quantidade, 0)
  const totalDefeito = dados.filter(d => d.status !== 'Aprovado').reduce((acc, curr) => acc + curr.quantidade, 0)
  const totalGeral = dados.reduce((acc, curr) => acc + curr.quantidade, 0)

  const prodPorDia = useMemo(() => {
    const mapa: Record<number, number> = {}
    dados.forEach(d => {
      const dateString = d.data_referencia || d.created_at.split('T')[0]
      const dateObj = new Date(dateString + 'T12:00:00Z') 
      if (dateObj.getMonth() === mesAtual && dateObj.getFullYear() === anoAtual) {
        const dia = dateObj.getDate()
        mapa[dia] = (mapa[dia] || 0) + d.quantidade
      }
    })
    return mapa
  }, [dados, mesAtual, anoAtual])

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate()
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay()

  function getCorCalendario(qtd: number) {
    if (!qtd || qtd === 0) return 'bg-white/5 text-slate-600 border-white/5'
    if (qtd < 6) return 'bg-blue-900/40 text-blue-300 border-blue-800/50'
    if (qtd <= 11) return 'bg-[#2f6eea] text-white border-[#2f6eea]'
    return 'bg-emerald-500 text-white border-emerald-400 font-black'
  }

  const topModelos = useMemo(() => {
    const contagem: Record<string, number> = {}
    dados.filter(d => d.status === 'Aprovado').forEach(d => {
      contagem[d.modelo] = (contagem[d.modelo] || 0) + d.quantidade
    })
    return Object.entries(contagem).map(([modelo, qtd]) => ({ modelo, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 5)
  }, [dados])

  /* ==========================================
     AÇÕES
     ========================================== */
  async function handleUpdate() {
    if (!editando) return
    setSalvando(true)
    const { error } = await supabase.from('estoque_producao_diaria').update({
        modelo: editando.modelo.toUpperCase(),
        quantidade: editando.quantidade,
        status: editando.status,
        serial_number: editando.serial_number?.toUpperCase().trim() || null,
        defeito_relatado: editando.defeito_relatado?.trim() || null
      }).eq('id', editando.id)
    if (!error) { setEditando(null); fetchProducao() }
    setSalvando(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Excluir permanentemente?')) {
      await supabase.from('estoque_producao_diaria').delete().eq('id', id)
      fetchProducao()
    }
  }

  const dadosFiltrados = dados.filter(d => {
    const matchModelo = d.modelo.toLowerCase().includes(filtroModelo.toLowerCase())
    const matchSN = buscaSN === '' || (d.serial_number && d.serial_number.toLowerCase().includes(buscaSN.toLowerCase()))
    return matchModelo && matchSN
  })

  if (loading) return <div className="min-h-screen bg-[#02052b] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white pb-20">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]"><TrendingUp size={14} /> Logística Inteligente</div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard de Reuso</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="Modelo..." value={filtroModelo} onChange={(e) => setFiltroModelo(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-[#2f6eea] outline-none w-full sm:w-48" />
            </div>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="S/N..." value={buscaSN} onChange={(e) => setBuscaSN(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-[#2f6eea] outline-none w-full sm:w-56 uppercase" />
            </div>
          </div>
        </div>

        {/* CARDS GLOBAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle2 size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aprovados</p><h2 className="text-3xl font-black">{totalAprovados}</h2></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400"><AlertTriangle size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Defeitos</p><h2 className="text-3xl font-black">{totalDefeito}</h2></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400"><Package size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Testado</p><h2 className="text-3xl font-black">{totalGeral}</h2></div>
          </div>
        </div>

        {/* NOVA SEÇÃO: ACOMPANHAMENTO DE METAS (HOJE) */}
        <div className="bg-gradient-to-br from-[#070b3f] to-[#02052b] border border-blue-500/10 p-6 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} className="text-blue-400" />
            <h3 className="font-black text-sm uppercase tracking-widest">Painel de Metas da Equipe (Hoje)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumoMetasHoje.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Nenhum técnico iniciou os testes hoje.</p>
            ) : (
              resumoMetasHoje.map((tech) => {
                const percent = Math.min(Math.round((tech.total / tech.meta) * 100), 100)
                const concluido = tech.total >= tech.meta
                return (
                  <div key={tech.nome} className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${concluido ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white flex items-center gap-2">
                            {tech.nome} {concluido && <Trophy size={14} className="text-yellow-500" />}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Bancada de Testes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-white">{tech.total}</span>
                        <span className="text-xs font-bold text-slate-500">/{tech.meta}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className={concluido ? 'text-emerald-400' : 'text-slate-500'}>{concluido ? 'Meta Batida' : 'Em andamento'}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${concluido ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* GRID COM GRÁFICOS E CALENDÁRIO (REDUZIDO PARA DAR ESPAÇO) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl lg:col-span-1">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-[#2f6eea]" /> Produtividade</h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D','S','T','Q','Q','S','S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-slate-500">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: primeiroDiaDoMes}).map((_, i) => <div key={i} />)}
              {Array.from({length: diasNoMes}).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold border ${getCorCalendario(prodPorDia[i+1] || 0)}`}>{i+1}</div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl lg:col-span-2">
             <div className="flex items-center gap-2 mb-6"><BarChart3 size={18} className="text-[#2f6eea]" /><h3 className="font-bold text-sm">Desempenho da Semana</h3></div>
             <div className="flex items-end h-32 gap-3">
                {ultimos7Dias.map((dia, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-emerald-500 rounded-t-md transition-all" style={{ height: `${(dia.aprovados / maxAprovados) * 100}%` }} />
                    <span className="text-[9px] font-bold text-slate-500">{dia.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* TABELA DE REGISTROS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">S/N</th>
                <th className="px-6 py-4">Qtd</th>
                <th className="px-6 py-4">Técnico</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dadosFiltrados.slice(0, 20).map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-bold uppercase">{item.modelo}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-blue-400">{item.serial_number || '---'}</td>
                  <td className="px-6 py-4 font-black">{item.quantidade}</td>
                  <td className="px-6 py-4 text-slate-300">{item.profiles?.nome}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${item.status === 'Aprovado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditando(item)} className="text-blue-400 p-1"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070b3f] w-full max-w-sm rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center"><h3 className="font-black uppercase text-sm">Editar Registro</h3><button onClick={() => setEditando(null)}><X size={20} /></button></div>
            <div className="space-y-4">
              <input type="text" value={editando.modelo} onChange={(e) => setEditando({...editando, modelo: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none uppercase font-bold" />
              <input type="text" value={editando.serial_number || ''} onChange={(e) => setEditando({...editando, serial_number: e.target.value})} placeholder="S/N" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none font-mono" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={editando.quantidade} onChange={(e) => setEditando({...editando, quantidade: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none font-black" />
                <select value={editando.status} onChange={(e) => setEditando({...editando, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none font-bold">
                  <option value="Aprovado">Aprovado</option><option value="Defeito">Defeito</option><option value="Sucata">Sucata</option>
                </select>
              </div>
            </div>
            <button onClick={handleUpdate} disabled={salvando} className="w-full bg-blue-600 py-4 rounded-xl font-black text-sm">{salvando ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </div>
      )}
    </main>
  )
}