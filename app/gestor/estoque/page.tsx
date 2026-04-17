'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, CheckCircle2, AlertTriangle, XCircle, TrendingUp, 
  User, Calendar, Search, Cpu, Pencil, Trash2, X, Save, Loader2
} from 'lucide-react'

type Producao = {
  id: string
  created_at: string
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

  async function handleUpdate() {
    if (!editando) return
    setSalvando(true)
    
    const { error } = await supabase
      .from('estoque_producao_diaria')
      .update({
        modelo: editando.modelo.toUpperCase(),
        quantidade: editando.quantidade,
        status: editando.status
      })
      .eq('id', editando.id)

    if (error) {
      alert('Erro ao atualizar: ' + error.message)
    } else {
      setEditando(null)
      fetchProducao()
    }
    setSalvando(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este registro permanentemente?')) return
    
    const { error } = await supabase
      .from('estoque_producao_diaria')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      fetchProducao()
    }
  }

  // Cálculos de Resumo
  const totalAprovados = dados.filter(d => d.status === 'Aprovado').reduce((acc, curr) => acc + curr.quantidade, 0)
  const totalDefeito = dados.filter(d => d.status === 'Defeito').reduce((acc, curr) => acc + curr.quantidade, 0)
  const totalGeral = dados.reduce((acc, curr) => acc + curr.quantidade, 0)

  const dadosFiltrados = dados.filter(d => d.modelo.toLowerCase().includes(filtroModelo.toLowerCase()))

  if (loading) return <div className="min-h-screen bg-[#02052b] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" /></div>

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]"><TrendingUp size={14} /> Logística</div>
            <h1 className="text-3xl font-black tracking-tight">Controle de Reuso</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Buscar modelo..." value={filtroModelo} onChange={(e) => setFiltroModelo(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none w-full md:w-64 transition-all" />
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle2 size={24} /></div>
            <div><p className="text-[10px] font-black uppercase text-slate-500">Aprovados</p><h2 className="text-3xl font-black">{totalAprovados}</h2></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400"><AlertTriangle size={24} /></div>
            <div><p className="text-[10px] font-black uppercase text-slate-500">Com Defeito</p><h2 className="text-3xl font-black">{totalDefeito}</h2></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400"><Package size={24} /></div>
            <div><p className="text-[10px] font-black uppercase text-slate-500">Total Testado</p><h2 className="text-3xl font-black">{totalGeral}</h2></div>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase text-slate-500 font-black">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Modelo</th>
                  <th className="px-6 py-4 text-center">Qtd</th>
                  <th className="px-6 py-4">Técnico</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dadosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-bold uppercase">{item.modelo}</td>
                    <td className="px-6 py-4 text-center font-black text-blue-400">{item.quantidade}</td>
                    <td className="px-6 py-4 text-slate-300">{item.profiles?.nome}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${
                        item.status === 'Aprovado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                        item.status === 'Defeito' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditando(item)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><Pencil size={16} /></button>
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
                <input type="text" value={editando.modelo} onChange={(e) => setEditando({...editando, modelo: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade</label>
                <input type="number" value={editando.quantidade} onChange={(e) => setEditando({...editando, quantidade: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                <select value={editando.status} onChange={(e) => setEditando({...editando, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="Aprovado">Aprovado</option>
                  <option value="Defeito">Defeito</option>
                  <option value="Sucata">Sucata</option>
                </select>
              </div>
            </div>

            <button onClick={handleUpdate} disabled={salvando} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
              {salvando ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> SALVAR ALTERAÇÕES</>}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}