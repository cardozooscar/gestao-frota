'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, CheckCircle2, AlertTriangle, TrendingUp, 
  Search, Cpu, Pencil, Trash2, X, Save, Loader2,
  CalendarDays, Trophy, BarChart3, Activity
} from 'lucide-react'

type Producao = {
  id: string
  created_at: string
  data_referencia?: string
  modelo: string
  quantidade: number
  status: 'Aprovado' | 'Defeito' | 'Sucata'
  profiles: { nome: string } | null
}

export default function GestaoEstoquePage() {
  const [dados, setDados] = useState<Producao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroModelo, setFiltroModelo] = useState('')
  
  // Estados para Edição
  const [editando, setEditando] = useState<Producao | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Datas Base
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  useEffect(() => {
    fetchProducao()
  }, [])

  async function fetchProducao() {
    setLoading(true)
    const { data, error } = await supabase
      .from('estoque_producao_diaria')
      .select('*, profiles:tecnico_id(nome)')
      .order('created_at', { ascending: false })

    if (data) setDados(data as Producao[])
    setLoading(false)
  }

  /* ==========================================
     LÓGICA DE DADOS PARA OS GRÁFICOS E RESUMOS
     ========================================== */

  // 1. Resumo Geral
  const totalAprovados = dados.filter(d => d.status === 'Aprovado').reduce((acc, curr) => acc + curr.quantidade, 0)
  const totalDefeito = dados.filter(d => d.status !== 'Aprovado').reduce((acc, curr) => acc + curr.quantidade, 0)
  const totalGeral = dados.reduce((acc, curr) => acc + curr.quantidade, 0)

  // 2. Calendário Mensal (Produtividade por Dia)
  const prodPorDia = useMemo(() => {
    const mapa: Record<number, number> = {}
    dados.forEach(d => {
      // Usa data_referencia se existir, senão usa created_at
      const dateString = d.data_referencia || d.created_at.split('T')[0]
      const dateObj = new Date(dateString + 'T12:00:00Z') // Força meio-dia para evitar fuso horário
      
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
    if (qtd < 6) return 'bg-blue-900/40 text-blue-300 border-blue-800/50' // BAIXO
    if (qtd <= 11) return 'bg-[#2f6eea] text-white border-[#2f6eea] shadow-lg shadow-blue-500/20' // MÉDIO
    return 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black' // ALTO
  }

  // 3. Top Equipamentos Aprovados
  const topModelos = useMemo(() => {
    const aprovados = dados.filter(d => d.status === 'Aprovado')
    const contagem: Record<string, number> = {}
    aprovados.forEach(d => {
      contagem[d.modelo] = (contagem[d.modelo] || 0) + d.quantidade
    })
    return Object.entries(contagem)
      .map(([modelo, qtd]) => ({ modelo, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5) // Pega os 5 primeiros
  }, [dados])

  // 4. Gráficos dos Últimos 7 Dias
  const ultimos7Dias = useMemo(() => {
    const dias = []
    for(let i=6; i>=0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dias.push(d)
    }
    return dias.map(dataObj => {
      const iso = dataObj.toISOString().split('T')[0]
      const records = dados.filter(d => (d.data_referencia || d.created_at.split('T')[0]) === iso)
      const aprovados = records.filter(r => r.status === 'Aprovado').reduce((a, b) => a + b.quantidade, 0)
      const ruins = records.filter(r => r.status !== 'Aprovado').reduce((a, b) => a + b.quantidade, 0)
      return { label: dataObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(), aprovados, ruins }
    })
  }, [dados])

  const maxAprovados = Math.max(...ultimos7Dias.map(d => d.aprovados), 1)
  const maxRuins = Math.max(...ultimos7Dias.map(d => d.ruins), 1)

  /* ==========================================
     FUNÇÕES DE AÇÃO (EDITAR / EXCLUIR)
     ========================================== */

  async function handleUpdate() {
    if (!editando) return
    setSalvando(true)
    const { error } = await supabase.from('estoque_producao_diaria').update({
        modelo: editando.modelo.toUpperCase(),
        quantidade: editando.quantidade,
        status: editando.status
      }).eq('id', editando.id)

    if (error) alert('Erro ao atualizar: ' + error.message)
    else { setEditando(null); fetchProducao() }
    setSalvando(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este registro permanentemente?')) return
    const { error } = await supabase.from('estoque_producao_diaria').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else fetchProducao()
  }

  const dadosFiltrados = dados.filter(d => d.modelo.toLowerCase().includes(filtroModelo.toLowerCase()))

  if (loading) return <div className="min-h-screen bg-[#02052b] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" size={40} /></div>

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white pb-20">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <TrendingUp size={14} /> Logística Inteligente
            </div>
            <h1 className="text-3xl font-black tracking-tight">Dashboard de Reuso</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Buscar modelo..." value={filtroModelo} onChange={(e) => setFiltroModelo(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-[#2f6eea] outline-none w-full md:w-64 transition-all" />
          </div>
        </div>

        {/* CARDS GLOBAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle2 size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aprovados (Total)</p><h2 className="text-3xl font-black">{totalAprovados}</h2></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400"><AlertTriangle size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Defeito / Sucata</p><h2 className="text-3xl font-black">{totalDefeito}</h2></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400"><Package size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Volume Total Testado</p><h2 className="text-3xl font-black">{totalGeral}</h2></div>
          </div>
        </div>

        {/* NOVA ÁREA DE INTELIGÊNCIA: GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          
          {/* CALENDÁRIO TÉRMICO */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2"><CalendarDays size={18} className="text-[#2f6eea]" /> Produtividade Diária</h3>
              <span className="text-[10px] font-black text-slate-500 uppercase">{hoje.toLocaleString('pt-BR', { month: 'long' })}</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
              {['D','S','T','Q','Q','S','S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-slate-500">{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({length: primeiroDiaDoMes}).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({length: diasNoMes}).map((_, i) => {
                const dia = i + 1;
                const qtd = prodPorDia[dia] || 0;
                return (
                  <div key={dia} title={`${qtd} testados`} className={`aspect-square rounded-lg flex items-center justify-center border transition-all hover:scale-110 cursor-help ${getCorCalendario(qtd)}`}>
                    <span className="text-[10px] font-bold">{dia}</span>
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="mt-5 flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-900/40 border border-blue-800/50"/> Baixo</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#2f6eea]"/> Médio</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"/> Alto</div>
            </div>
          </div>

          {/* GRÁFICOS DE BARRAS (ÚLTIMOS 7 DIAS) */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-[#2f6eea]" />
              <h3 className="font-bold text-sm">Desempenho da Semana (Últimos 7 dias)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Gráfico Bons */}
              <div className="flex flex-col h-full">
                <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-widest">Equipamentos Aprovados</p>
                <div className="flex items-end h-32 gap-2 mt-auto">
                  {ultimos7Dias.map((dia, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full bg-emerald-500/10 rounded-t-md relative flex items-end h-full">
                        <div className="w-full bg-emerald-500 rounded-t-md transition-all duration-1000" style={{ height: `${(dia.aprovados / maxAprovados) * 100}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold text-emerald-300 transition-opacity">{dia.aprovados}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500">{dia.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico Ruins */}
              <div className="flex flex-col h-full">
                <p className="text-[10px] font-black uppercase text-red-400 mb-2 tracking-widest">Defeitos & Sucatas</p>
                <div className="flex items-end h-32 gap-2 mt-auto">
                  {ultimos7Dias.map((dia, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full bg-red-500/10 rounded-t-md relative flex items-end h-full">
                        <div className="w-full bg-red-500 rounded-t-md transition-all duration-1000" style={{ height: `${(dia.ruins / maxRuins) * 100}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-300 transition-opacity">{dia.ruins}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500">{dia.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TOP EQUIPAMENTOS APROVADOS */}
          <div className="bg-gradient-to-br from-[#070b3f] to-[#02052b] border border-white/10 p-6 rounded-3xl backdrop-blur-md lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-yellow-500" />
              <h3 className="font-bold text-sm">Top 5 Modelos Mais Aprovados</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topModelos.length === 0 ? (
                <p className="text-sm text-slate-500 col-span-5 text-center py-4">Nenhum equipamento aprovado ainda.</p>
              ) : (
                topModelos.map((item, index) => (
                  <div key={item.modelo} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-500">#{index + 1}</span>
                      <Activity size={14} className="text-[#2f6eea]" />
                    </div>
                    <p className="font-black uppercase text-sm truncate" title={item.modelo}>{item.modelo}</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{item.qtd} <span className="text-[9px] text-slate-500">unid.</span></p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TABELA DE REGISTROS (MANTIDA) */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
          <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Últimos Lançamentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Modelo</th>
                  <th className="px-6 py-4 text-center">Qtd</th>
                  <th className="px-6 py-4">Técnico</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dadosFiltrados.slice(0, 50).map((item) => ( // Mostra os 50 últimos para não pesar a tabela
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-bold uppercase flex items-center gap-2">
                      <Cpu size={14} className="text-[#2f6eea]" /> {item.modelo}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-[#2f6eea] text-base">{item.quantidade}</td>
                    <td className="px-6 py-4 text-slate-300">{item.profiles?.nome}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border tracking-widest ${
                        item.status === 'Aprovado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                        item.status === 'Defeito' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditando(item)} className="p-2 hover:bg-[#2f6eea]/20 text-[#2f6eea] rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070b3f] w-full max-w-sm rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Editar Registro</h3>
              <button onClick={() => setEditando(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Modelo</label>
                <input type="text" value={editando.modelo} onChange={(e) => setEditando({...editando, modelo: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2f6eea] uppercase font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade</label>
                <input type="number" value={editando.quantidade} onChange={(e) => setEditando({...editando, quantidade: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2f6eea] font-black" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                <select value={editando.status} onChange={(e) => setEditando({...editando, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2f6eea] font-bold">
                  <option value="Aprovado">Aprovado</option>
                  <option value="Defeito">Defeito</option>
                  <option value="Sucata">Sucata</option>
                </select>
              </div>
            </div>
            <button onClick={handleUpdate} disabled={salvando} className="w-full bg-[#2f6eea] hover:bg-blue-600 py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95">
              {salvando ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> SALVAR ALTERAÇÕES</>}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}