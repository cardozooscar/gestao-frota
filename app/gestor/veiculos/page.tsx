'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Car, Plus, Trash2, Image as ImageIcon, Power, Settings2, AlertCircle } from 'lucide-react'

type Vehicle = {
  id: string
  placa: string
  modelo: string
  tipo: string // 'Próprio' ou 'Alugado'
  foto_url: string
  ativo: boolean
}

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState<'ativos' | 'inativos'>('ativos')

  // Estados do formulário
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [tipo, setTipo] = useState('Próprio')
  const [fotoUrl, setFotoUrl] = useState('')

  async function fetchVeiculos() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setVeiculos(data as Vehicle[])
    setLoading(false)
  }

  useEffect(() => {
    fetchVeiculos()
  }, [])

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase.from('vehicles').insert({
      placa: placa.toUpperCase(),
      modelo,
      tipo,
      foto_url: fotoUrl,
      ativo: true, // Por padrão, entra como ativo
      is_active: true
    })

    if (!error) {
      setPlaca('')
      setModelo('')
      setTipo('Próprio')
      setFotoUrl('')
      fetchVeiculos()
    } else {
      alert('Erro ao cadastrar veículo: ' + error.message)
    }
    setSalvando(false)
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    if (!confirm(`Deseja ${estadoAtual ? 'desativar' : 'ativar'} este veículo?`)) return
    
    await supabase.from('vehicles').update({ 
      ativo: !estadoAtual,
      is_active: !estadoAtual 
    }).eq('id', id)
    
    fetchVeiculos()
  }

  async function handleExcluir(id: string) {
    if (!confirm('ATENÇÃO: Deseja excluir este veículo permanentemente?')) return
    await supabase.from('vehicles').delete().eq('id', id)
    fetchVeiculos()
  }

  const veiculosFiltrados = veiculos.filter(v => filtro === 'ativos' ? v.ativo : !v.ativo)
  const qtdAtivos = veiculos.filter(v => v.ativo).length
  const qtdInativos = veiculos.filter(v => !v.ativo).length

  return (
    <div className="min-h-screen bg-[#02052b] text-white p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Car size={14} /> Frota
            </div>
            <h1 className="text-3xl font-black tracking-tight">Veículos</h1>
            <p className="text-slate-400 text-sm">Cadastre e gerencie os veículos da operação.</p>
          </div>
        </div>

        {/* FORMULÁRIO DE CADASTRO */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus size={20} className="text-blue-400" /> Novo veículo
            </h2>
            <p className="text-xs text-slate-400 mt-1">Preencha os dados principais para adicionar um novo item à frota.</p>
          </div>

          <form onSubmit={handleCadastrar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" placeholder="Placa (ex: ABC-1234)" required
                value={placa} onChange={e => setPlaca(e.target.value)}
                className="w-full bg-[#070b3f] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-[#2f6eea] outline-none transition-all uppercase"
              />
              <input 
                type="text" placeholder="Modelo (ex: Fiat Uno)" required
                value={modelo} onChange={e => setModelo(e.target.value)}
                className="w-full bg-[#070b3f] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-[#2f6eea] outline-none transition-all"
              />
              <select 
                value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full bg-[#070b3f] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#2f6eea] outline-none transition-all appearance-none"
              >
                <option value="Próprio">Próprio</option>
                <option value="Alugado">Alugado</option>
              </select>
              <input 
                type="url" placeholder="URL da imagem (opcional)" 
                value={fotoUrl} onChange={e => setFotoUrl(e.target.value)}
                className="w-full bg-[#070b3f] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-[#2f6eea] outline-none transition-all"
              />
            </div>
            <button 
              type="submit" disabled={salvando}
              className="w-full md:w-auto px-8 py-4 bg-[#2f6eea] hover:bg-[#255ed0] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? 'CADASTRANDO...' : 'CADASTRAR VEÍCULO'}
            </button>
          </form>
        </div>

        {/* LISTAGEM DE VEÍCULOS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          
          {/* Cabeçalho e Filtros da Listagem */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings2 size={20} className="text-blue-400" /> Veículos cadastrados
              </h2>
              <p className="text-xs text-slate-400 mt-1">Visualize e gerencie os veículos disponíveis no sistema.</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-slate-400">Total: {veiculos.length}</span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400">Ativos: {qtdAtivos}</span>
              <span className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-400">Inativos: {qtdInativos}</span>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex gap-2 mb-6 bg-[#070b3f] p-1 rounded-xl w-fit border border-white/5">
            <button 
              onClick={() => setFiltro('ativos')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filtro === 'ativos' ? 'bg-[#2f6eea] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Ativos ({qtdAtivos})
            </button>
            <button 
              onClick={() => setFiltro('inativos')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filtro === 'inativos' ? 'bg-[#2f6eea] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Inativos ({qtdInativos})
            </button>
          </div>

          {/* Grid de Cards */}
          {loading ? (
            <div className="py-12 text-center text-slate-500">Carregando frota...</div>
          ) : veiculosFiltrados.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-3">
              <AlertCircle size={32} className="text-slate-600" />
              <p className="text-slate-400 text-sm">Nenhum veículo encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {veiculosFiltrados.map((v) => (
                <div key={v.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10">
                  
                  {/* Área da Imagem */}
                  <div className="aspect-video relative bg-[#070b3f] flex items-center justify-center overflow-hidden">
                    {v.foto_url ? (
                      <img src={v.foto_url} alt={v.modelo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                    ) : (
                      <Car size={48} className="text-white/10" />
                    )}
                    
                    {/* Badges Flutuantes */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${v.tipo === 'Alugado' ? 'bg-purple-500/80 text-white backdrop-blur-md' : 'bg-blue-500/80 text-white backdrop-blur-md'}`}>
                        {v.tipo || 'Próprio'}
                      </span>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${v.ativo ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                        {v.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Informações do Veículo */}
                  <div className="p-5">
                    <h3 className="text-2xl font-black tracking-tight text-white">{v.placa}</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">{v.modelo}</p>
                    
                    {/* Ações */}
                    <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                      <button 
                        onClick={() => toggleAtivo(v.id, v.ativo)}
                        className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${v.ativo ? 'text-orange-400 hover:bg-orange-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                      >
                        <Power size={14} />
                        {v.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      
                      <button 
                        onClick={() => handleExcluir(v.id)}
                        className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}