'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Car, Plus, Trash2, Image as ImageIcon, Power, Settings2, AlertCircle } from 'lucide-react'

// tipagem Vehicle unificada para usar 'url_foto'
type Vehicle = {
  id: string
  placa: string
  modelo: string
  tipo: string // 'Próprio' ou 'Alugado'
  url_foto: string // campo condizente com o banco de dados
  ativo: boolean
}

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState<'ativos' | 'inativos'>('ativos')

  // Estados do formulário unificados para usar 'urlFoto' no frontend
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [tipo, setTipo] = useState('Próprio')
  const [urlFoto, setUrlFoto] = useState('') // estado no frontend unificado

  async function fetchVeiculos() {
    const { data } = await supabase
      .from('vehicles')
      .select('*') // o select('*') está correto
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

    // insert unificado para inserir no campo 'url_foto' do banco
    const { error } = await supabase.from('vehicles').insert({
      placa: placa.toUpperCase(),
      modelo,
      tipo,
      url_foto: urlFoto, // inserindo no campo 'url_foto' do banco
      ativo: true, 
      is_active: true
    })

    if (!error) {
      setPlaca('')
      setModelo('')
      setTipo('Próprio')
      setUrlFoto('') // resetando o estado correto no frontend
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
        
        {/* HEADER DA PÁGINA (Pode manter o mesmo do código anterior) */}
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
                value={urlFoto} onChange={e => setUrlFoto(e.target.value)} // usando estado correto
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
          {/* ...cabeçalho e filtros da listagem (pode manter os mesmos)... */}

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
                  
                  {/* Área da Imagem (UNIFICADO AQUI) */}
                  <div className="aspect-video relative bg-[#070b3f] flex items-center justify-center overflow-hidden">
                    {v.url_foto ? ( // lendo o campo 'url_foto' do banco
                      <img src={v.url_foto} alt={v.modelo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                    ) : (
                      <Car size={48} className="text-white/10" />
                    )}
                    
                    {/* ...Badges flutuantes (pode manter os mesmos)... */}
                  </div>

                  {/* Informações do Veículo */}
                  {/* ...pode manter o resto... */}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}