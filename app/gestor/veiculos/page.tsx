'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Clock, Car, Power, ChevronRight, Activity } from 'lucide-react'

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para os Filtros
  const [abaAtual, setAbaAtual] = useState<'ativos' | 'inativos'>('ativos')
  const [buscaPlaca, setBuscaPlaca] = useState('')
  const [filtroRecentes, setFiltroRecentes] = useState(false)

  useEffect(() => {
    async function fetchVeiculos() {
      try {
        setLoading(true)
        
        // 1. Busca os veículos puros (sem joins, para não dar erro no Supabase)
        const { data: vData, error: vError } = await supabase
          .from('vehicles')
          .select('*')
          .order('placa', { ascending: true })

        if (vError) throw vError

        // 2. Busca apenas as datas das inspeções para cruzar depois
        const { data: iData } = await supabase
          .from('inspections')
          .select('vehicle_id, inspection_date')

        // 3. Cruza os dados manualmente (Método à prova de falhas)
        const veiculosProcessados = vData?.map(v => {
          // Pega todas as inspeções deste carro específico
          const inspecoesDoCarro = iData?.filter(i => i.vehicle_id === v.id) || [];
          
          let ultimaInspecao = null;
          
          if (inspecoesDoCarro.length > 0) {
            // Descobre qual é a data mais recente
            const datas = inspecoesDoCarro.map(i => new Date(i.inspection_date).getTime());
            ultimaInspecao = new Date(Math.max(...datas));
          }
          
          return { ...v, ultimaInspecao }
        })

        setVeiculos(veiculosProcessados || [])
      } catch (error) {
        console.error('Erro ao buscar veículos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVeiculos()
  }, [])

  // Lógica de Filtragem
  const veiculosFiltrados = veiculos.filter(v => {
    // 1. Filtro da Aba (Ativo/Inativo)
    const isAtivo = v.ativo === true;
    if (abaAtual === 'ativos' && !isAtivo) return false;
    if (abaAtual === 'inativos' && isAtivo) return false;

    // 2. Filtro de Placa (Busca)
    if (buscaPlaca && !v.placa.toLowerCase().includes(buscaPlaca.toLowerCase())) {
      return false;
    }

    // 3. Filtro de Inspeções Recentes (Últimos 7 dias)
    if (filtroRecentes) {
      if (!v.ultimaInspecao) return false; // Se nunca foi inspecionado, esconde
      
      const hoje = new Date();
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      
      if (v.ultimaInspecao < seteDiasAtras) {
        return false; // Se a última inspeção for mais velha que 7 dias, esconde
      }
    }

    return true;
  })

  // Contadores para o Header
  const totalAtivos = veiculos.filter(v => v.ativo).length
  const totalInativos = veiculos.filter(v => !v.ativo).length

  return (
    <div className="flex-1 p-8 bg-[#0a0f2c] min-h-screen font-sans">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Car className="text-blue-500" /> Veículos cadastrados
          </h1>
          <p className="text-slate-400 mt-1">Visualize rapidamente os veículos disponíveis no sistema.</p>
        </div>
        
        {/* Contadores */}
        <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
          <div className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-lg">
            Total: {veiculos.length}
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg">
            Ativos: {totalAtivos}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg">
            Inativos: {totalInativos}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        
        {/* BARRA DE FERRAMENTAS E FILTROS */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 border-b border-white/10 pb-6">
          
          {/* Abas */}
          <div className="flex gap-2 w-full lg:w-auto bg-black/20 p-1 rounded-xl">
            <button 
              onClick={() => setAbaAtual('ativos')}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${abaAtual === 'ativos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Ativos ({totalAtivos})
            </button>
            <button 
              onClick={() => setAbaAtual('inativos')}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${abaAtual === 'inativos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Inativos ({totalInativos})
            </button>
          </div>

          {/* Novos Filtros: Busca e Recentes */}
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por placa..." 
                value={buscaPlaca}
                onChange={(e) => setBuscaPlaca(e.target.value)}
                className="w-full sm:w-64 bg-black/20 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all uppercase"
              />
            </div>
            
            <button 
              onClick={() => setFiltroRecentes(!filtroRecentes)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                filtroRecentes 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Clock size={18} /> 
              {filtroRecentes ? 'Vistoriados (7 dias)' : 'Filtrar Recentes'}
            </button>
          </div>

        </div>

        {/* GRID DE VEÍCULOS */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : veiculosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {veiculosFiltrados.map((veiculo) => (
              <div key={veiculo.id} className="bg-[#0f153a] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group shadow-lg flex flex-col">
                
                {/* Imagem Placeholder */}
                <div className="relative h-48 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center p-4">
                  {/* Badges superiores */}
                  <div className="absolute top-4 left-4 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider">
                    {veiculo.tipo || 'PRÓPRIO'}
                  </div>
                  <div className={`absolute top-4 right-4 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${veiculo.ativo ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {veiculo.ativo ? 'ATIVO' : 'INATIVO'}
                  </div>
                  
                  {/* Ícone de Carro - Altere aqui se tiver fotos reais dos carros cadastradas */}
                  <Car size={80} className="text-white/10 group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Informações */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-wider">{veiculo.placa}</h3>
                    <p className="text-slate-400 text-sm font-medium uppercase mt-1">{veiculo.modelo}</p>
                    
                    {/* Exibe o status da última inspeção */}
                    <div className="mt-4 flex items-center gap-2">
                      {veiculo.ultimaInspecao ? (
                         <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 flex items-center gap-1">
                           <Activity size={12} /> Última: {veiculo.ultimaInspecao.toLocaleDateString('pt-BR')}
                         </span>
                      ) : (
                         <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20 flex items-center gap-1">
                           <Activity size={12} /> Sem vistorias
                         </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                    <button className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 uppercase tracking-wider transition-colors">
                      <Power size={14} /> Desativar
                    </button>
                    <Link 
                      href={`/gestor/veiculos/${veiculo.id}`}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-wider transition-colors"
                    >
                      Detalhes <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            Nenhum veículo encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  )
}