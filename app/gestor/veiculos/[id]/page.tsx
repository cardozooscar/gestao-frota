'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { CheckCircle2, ShieldCheck, Activity, Droplets, Camera, Trash2, Calendar } from 'lucide-react'

export default function VeiculoDetalhesPage() {
  const params = useParams()
  const vehicleId = params.id as string

  const [loading, setLoading] = useState(true)
  const [inspections, setInspections] = useState<any[]>([])
  const [vehicle, setVehicle] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // 1. Busca os dados básicos do veículo
        const { data: vData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single()

        if (vData) setVehicle(vData)

        // 2. Busca as inspeções e as fotos vinculadas
        const { data: iData, error } = await supabase
          .from('inspections')
          .select(`
            *,
            profiles (nome),
            inspection_photos (*) 
          `)
          .eq('vehicle_id', vehicleId)
          .order('inspection_date', { ascending: false })

        if (error) console.error("Erro ao buscar inspeções:", error)
        setInspections(iData || [])

      } catch (error) {
        console.error("Erro geral:", error)
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) loadData()
  }, [vehicleId])

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await supabase.from('inspections').delete().eq('id', id)
      setInspections(inspections.filter(i => i.id !== id))
    }
  }

  // O PULO DO GATO: Lógica que agrupa as inspeções por Mês e Ano dinamicamente
  const gruposPorMes = useMemo(() => {
    const grupos: { mesAno: string, inspecoes: any[] }[] = [];
    
    inspections.forEach(inspecao => {
      let mesAno = 'Data Indefinida';
      
      // Converte a data ignorando o fuso horário para cair no mês certo
      if (inspecao.inspection_date) {
        const parts = inspecao.inspection_date.split('-');
        if (parts.length >= 3) {
          const dataLocal = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          mesAno = dataLocal.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }
      }

      // Procura se o bloco deste mês já existe, se não, cria um novo
      let grupo = grupos.find(g => g.mesAno === mesAno);
      if (!grupo) {
        grupo = { mesAno, inspecoes: [] };
        grupos.push(grupo);
      }
      
      grupo.inspecoes.push(inspecao);
    });
    
    return grupos;
  }, [inspections]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 bg-[#0a0f2c] min-h-screen font-sans">
      
      {/* Título Principal */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{vehicle?.placa || 'Carregando...'}</h1>
        <p className="text-blue-200 uppercase">{vehicle?.modelo || 'Detalhes do Veículo'}</p>
      </div>

      <div className="space-y-8">
        {gruposPorMes.length > 0 ? gruposPorMes.map((grupo) => (
          
          /* CARD MESTRE DE CADA MÊS */
          <div key={grupo.mesAno} className="bg-white rounded-3xl p-8 shadow-xl">
            
            {/* Cabeçalho do Mês */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-3">
                  <Calendar className="text-blue-500" /> {grupo.mesAno}
                </h2>
                <p className="text-slate-500 mt-1">{grupo.inspecoes.length} vistoria(s) realizada(s) neste mês</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Activity size={24} />
              </div>
            </div>

            {/* Lista de Inspeções dentro daquele Mês */}
            <div className="space-y-10">
              {grupo.inspecoes.map((inspection) => (
                <div key={inspection.id} className="border border-slate-100 rounded-2xl p-6 shadow-sm bg-slate-50/50">
                  
                  {/* Cabeçalho da Inspeção Individual */}
                  <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                          {new Date(inspection.inspection_date).toLocaleDateString('pt-BR')}
                        </h3>
                        <p className="text-sm text-slate-500">Protocolo: {inspection.id.split('-')[0]}</p>
                        <p className="text-sm text-blue-600 font-medium">Técnico: {inspection.profiles?.nome || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-slate-800 text-white px-4 py-2 rounded-xl font-black text-lg mb-2">
                        {inspection.odometer?.toLocaleString('pt-BR')} KM
                      </div>
                      <button 
                        onClick={() => handleDelete(inspection.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center justify-end gap-1 w-full"
                      >
                        <Trash2 size={14} /> EXCLUIR REGISTRO
                      </button>
                    </div>
                  </div>

                  {/* Registro Fotográfico */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <Camera size={18} className="text-blue-500" /> Registro Fotográfico
                    </h4>
                    
                    {inspection.inspection_photos && inspection.inspection_photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {inspection.inspection_photos.map((foto: any) => (
                          <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                            <img 
                              src={foto.public_url} 
                              alt={foto.photo_type} 
                              className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 border-t border-slate-200">
                              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest text-center">
                                {foto.photo_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center">
                        <p className="text-slate-500 text-sm font-medium">Nenhuma foto foi anexada a esta vistoria.</p>
                      </div>
                    )}
                  </div>

                  {/* Grid de Checklists */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Segurança */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                        <ShieldCheck size={18} className="text-blue-500" /> Itens de Segurança
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm font-medium">Triângulo</span>
                          {inspection.item_triangulo ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className="text-red-500 font-bold text-xs">FALTA</span>}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm font-medium">Macaco</span>
                          {inspection.item_macaco ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className="text-red-500 font-bold text-xs">FALTA</span>}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm font-medium">Chave de Roda</span>
                          {inspection.item_chave_roda ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className="text-red-500 font-bold text-xs">FALTA</span>}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm font-medium">Estepe</span>
                          {inspection.item_estepe ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className="text-red-500 font-bold text-xs">FALTA</span>}
                        </div>
                      </div>
                    </div>

                    {/* Motor */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                        <Activity size={18} className="text-orange-500" /> Condições do Motor
                      </h4>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nível do Óleo</span>
                          <span className="text-slate-700 font-semibold text-sm">{inspection.motor_oil_level || 'Não informado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Freios</span>
                          <span className="text-slate-700 font-semibold text-sm">{inspection.motor_brakes || 'Não informado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Suspensão</span>
                          <span className="text-slate-700 font-semibold text-sm">{inspection.motor_suspension || 'Não informado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Faróis</span>
                          <span className="text-slate-700 font-semibold text-sm">{inspection.motor_headlights || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Higienização */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                        <Droplets size={18} className="text-cyan-500" /> Higienização
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-100 rounded-lg p-2 text-center bg-slate-50">
                          <span className="block text-slate-500 text-[10px] font-bold mb-1">Tapetes</span>
                          <span className={`block text-xs font-black ${inspection.cleaning_mats ? 'text-emerald-500' : 'text-red-500'}`}>
                            {inspection.cleaning_mats ? 'OK' : 'SUJO'}
                          </span>
                        </div>
                        <div className="border border-slate-100 rounded-lg p-2 text-center bg-slate-50">
                          <span className="block text-slate-500 text-[10px] font-bold mb-1">Água</span>
                          <span className={`block text-xs font-black ${inspection.cleaning_water ? 'text-emerald-500' : 'text-red-500'}`}>
                            {inspection.cleaning_water ? 'OK' : 'FALTA'}
                          </span>
                        </div>
                        <div className="border border-slate-100 rounded-lg p-2 text-center bg-slate-50">
                          <span className="block text-slate-500 text-[10px] font-bold mb-1">Para-brisa</span>
                          <span className={`block text-xs font-black ${inspection.cleaning_windshield ? 'text-emerald-500' : 'text-red-500'}`}>
                            {inspection.cleaning_windshield ? 'OK' : 'SUJO'}
                          </span>
                        </div>
                        <div className="border border-slate-100 rounded-lg p-2 text-center bg-slate-50">
                          <span className="block text-slate-500 text-[10px] font-bold mb-1">Lataria</span>
                          <span className={`block text-xs font-black ${inspection.cleaning_bodywork ? 'text-emerald-500' : 'text-red-500'}`}>
                            {inspection.cleaning_bodywork ? 'OK' : 'SUJO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observações Dinâmicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Observações Gerais (Segurança)</span>
                      <p className="text-slate-600 text-sm mt-1 italic">
                        "{inspection.observation_general || 'Sem observações adicionais.'}"
                      </p>
                    </div>
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                      <span className="text-orange-600 text-[10px] font-bold uppercase tracking-wider">Nota Técnica (Motor)</span>
                      <p className="text-slate-600 text-sm mt-1 italic">
                        "{inspection.motor_observation || 'Nenhuma anomalia relatada.'}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 uppercase tracking-widest font-semibold">
                    Registro criado no sistema em {new Date(inspection.created_at || inspection.inspection_date).toLocaleString('pt-BR')}
                  </div>

                </div>
              ))}
            </div>
          </div>

        )) : (
          
          /* CASO NÃO HAJA NENHUMA VISTORIA */
          <div className="bg-white rounded-3xl p-16 text-center shadow-xl border border-slate-100">
            <Camera className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium text-lg">Nenhuma vistoria encontrada para este veículo.</p>
            <p className="text-slate-400 mt-2">Assim que um técnico realizar uma inspeção, ela aparecerá organizada por mês aqui.</p>
          </div>
        )}
      </div>
    </div>
  )
}