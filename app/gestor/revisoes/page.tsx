'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Wrench, Calendar, MapPin, Activity, DollarSign, FileText, X, Car } from 'lucide-react'

export default function RevisoesPage() {
  const [revisoes, setRevisoes] = useState<any[]>([])
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Dados do Formulário
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_date: new Date().toLocaleDateString('en-CA'),
    workshop_name: '',
    service_description: '',
    odometer: '',
    cost: '',
    notes: ''
  })

  // Função para buscar dados
  async function fetchDados() {
    try {
      setLoading(true)
      
      // 1. Busca os veículos para o select do formulário
      const { data: vData } = await supabase
        .from('vehicles')
        .select('id, placa, modelo')
        .order('placa', { ascending: true })
      
      setVeiculos(vData || [])

      // 2. Busca o histórico de revisões cruzando com os dados do veículo
      const { data: rData, error } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicles (placa, modelo)
        `)
        .order('maintenance_date', { ascending: false })

      if (error) throw error
      setRevisoes(rData || [])

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  // Função para salvar nova revisão
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Converte vírgula para ponto caso o usuário digite o custo com vírgula
      const custoFormatado = parseFloat(formData.cost.replace(',', '.'))

      const { error } = await supabase
        .from('maintenance_records')
        .insert([{
          vehicle_id: formData.vehicle_id,
          maintenance_date: formData.maintenance_date,
          workshop_name: formData.workshop_name,
          service_description: formData.service_description,
          odometer: parseInt(formData.odometer),
          cost: custoFormatado,
          notes: formData.notes
        }])

      if (error) throw error

      // Limpa o formulário, fecha o modal e recarrega a lista
      setFormData({
        vehicle_id: '',
        maintenance_date: new Date().toLocaleDateString('en-CA'),
        workshop_name: '',
        service_description: '',
        odometer: '',
        cost: '',
        notes: ''
      })
      setIsModalOpen(false)
      fetchDados()

    } catch (error) {
      console.error('Erro ao salvar revisão:', error)
      alert('Erro ao salvar o registro. Verifique os dados e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Lógica de busca
  const revisoesFiltradas = revisoes.filter(r => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      r.vehicles?.placa?.toLowerCase().includes(termo) ||
      r.workshop_name.toLowerCase().includes(termo) ||
      r.service_description.toLowerCase().includes(termo)
    )
  })

  // Formatador de Moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  return (
    <div className="flex-1 p-8 bg-[#0a0f2c] min-h-screen font-sans relative">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Wrench className="text-blue-500" /> Histórico de Revisões
          </h1>
          <p className="text-slate-400 mt-1">Controle de manutenções, trocas de óleo e serviços mecânicos.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} /> Nova Revisão
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        
        {/* BARRA DE BUSCA */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por placa, oficina ou serviço..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* LISTA DE REVISÕES */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : revisoesFiltradas.length > 0 ? (
          <div className="space-y-4">
            {revisoesFiltradas.map((revisao) => {
              // Correção de Fuso Horário para exibir a data certa
              const parts = revisao.maintenance_date.split('-');
              const dataFormatada = parts.length === 3 
                ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString('pt-BR')
                : revisao.maintenance_date;

              return (
                <div key={revisao.id} className="bg-black/20 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                  
                  {/* Bloco Placa/Data */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">{revisao.vehicles?.placa}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {dataFormatada}
                      </p>
                    </div>
                  </div>

                  {/* Bloco Serviço */}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg">{revisao.service_description}</h4>
                    <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {revisao.workshop_name}
                    </p>
                  </div>

                  {/* Bloco Info (KM e Valor) */}
                  <div className="flex gap-8 md:text-right">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center md:justify-end gap-1">
                        <Activity size={12} /> Odômetro
                      </p>
                      <p className="text-white font-medium">{revisao.odometer.toLocaleString('pt-BR')} KM</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center md:justify-end gap-1">
                        <DollarSign size={12} /> Custo
                      </p>
                      <p className="text-emerald-400 font-bold">{formatarMoeda(revisao.cost)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-black/10 rounded-2xl border border-dashed border-white/10">
            <Wrench className="mx-auto text-slate-600 mb-4" size={40} />
            <p className="text-slate-400 font-medium">Nenhum registro de revisão encontrado.</p>
            <p className="text-slate-500 text-sm mt-1">Clique em "Nova Revisão" para cadastrar o histórico da sua planilha.</p>
          </div>
        )}
      </div>

      {/* MODAL DE NOVA REVISÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f153a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-blue-500" /> Cadastrar Revisão
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="form-revisao" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Veículo */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1">Veículo *</label>
                    <select 
                      required
                      value={formData.vehicle_id}
                      onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="" className="bg-[#0f153a]">Selecione o veículo...</option>
                      {veiculos.map(v => (
                        <option key={v.id} value={v.id} className="bg-[#0f153a] uppercase">{v.placa} - {v.modelo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1">Data do Serviço *</label>
                    <input 
                      type="date" required
                      value={formData.maintenance_date}
                      onChange={e => setFormData({...formData, maintenance_date: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Oficina e KM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1 flex items-center gap-1"><MapPin size={12}/> Oficina / Local *</label>
                    <input 
                      type="text" required placeholder="Ex: Mecânica do João"
                      value={formData.workshop_name}
                      onChange={e => setFormData({...formData, workshop_name: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1 flex items-center gap-1"><Activity size={12}/> Hodômetro no momento (KM) *</label>
                    <input 
                      type="number" required placeholder="Ex: 45000"
                      value={formData.odometer}
                      onChange={e => setFormData({...formData, odometer: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Serviço e Valor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1 flex items-center gap-1"><Wrench size={12}/> Descrição do Serviço *</label>
                    <input 
                      type="text" required placeholder="Ex: Troca de óleo e filtro"
                      value={formData.service_description}
                      onChange={e => setFormData({...formData, service_description: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1 flex items-center gap-1"><DollarSign size={12}/> Custo Total (R$) *</label>
                    <input 
                      type="number" step="0.01" required placeholder="Ex: 350.00"
                      value={formData.cost}
                      onChange={e => setFormData({...formData, cost: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 ml-1 flex items-center gap-1"><FileText size={12}/> Observações Adicionais</label>
                  <textarea 
                    placeholder="Alguma peça precisa ser trocada na próxima revisão?"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition-all min-h-[80px]"
                  />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="form-revisao"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                {submitting ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}