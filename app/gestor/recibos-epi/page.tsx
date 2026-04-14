'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Package, User, PenTool, Image as ImageIcon, Search } from 'lucide-react'

// Tipagem unindo o recibo com o nome do técnico (que vem da tabela profiles)
type EpiRequest = {
  id: string
  created_at: string
  items: any
  photo_url: string
  signature_url: string
  profiles: { nome: string } | null
}

export default function RecibosEPIPage() {
  const [dataAtual, setDataAtual] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [recibosMes, setRecibosMes] = useState<EpiRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Busca os recibos sempre que o mês/ano mudar
  useEffect(() => {
    fetchRecibosDoMes()
  }, [dataAtual.getMonth(), dataAtual.getFullYear()])

  async function fetchRecibosDoMes() {
    setLoading(true)
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()
    
    // Pega o primeiro e último dia do mês para filtrar no banco
    const primeiroDia = new Date(ano, mes, 1).toISOString()
    const ultimoDia = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('epi_requests')
      .select('*, profiles(nome)') // Faz o JOIN automático com a tabela de perfis
      .gte('created_at', primeiroDia)
      .lte('created_at', ultimoDia)
      .order('created_at', { ascending: false })

    if (data) setRecibosMes(data as EpiRequest[])
    setLoading(false)
  }

  // Funções de navegação do calendário
  const prevMonth = () => setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1))
  const nextMonth = () => setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1))

  // Lógica para montar os quadradinhos do calendário
  const diasNoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate()
  const primeiroDiaDoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).getDay()
  
  const diasEmBranco = Array.from({ length: primeiroDiaDoMes })
  const diasDoMes = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  // Formata a data selecionada para YYYY-MM-DD
  const formatarDataLocal = (dia: number) => {
    const ano = dataAtual.getFullYear()
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0')
    const diaFormatado = String(dia).padStart(2, '0')
    return `${ano}-${mes}-${diaFormatado}`
  }

  // Filtra os recibos para mostrar só os do dia que o gestor clicou
  const recibosDoDiaSelecionado = recibosMes.filter(req => {
    if (!diaSelecionado) return false
    return req.created_at.startsWith(diaSelecionado)
  })

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Central de Recibos (EPI)</h1>
            <p className="text-sm text-slate-400">Gerencie as entregas de fardamento e materiais por data.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: O CALENDÁRIO */}
          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md h-fit">
            
            {/* Controles do Mês */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white capitalize">
                {dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-slate-500">
              <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-2">
              {diasEmBranco.map((_, i) => (
                <div key={`blank-${i}`} className="h-10 rounded-xl bg-transparent" />
              ))}
              
              {diasDoMes.map(dia => {
                const dataFormatada = formatarDataLocal(dia)
                // Verifica se tem recibo nesse dia para colocar a "bolinha" indicadora
                const temRecibo = recibosMes.some(req => req.created_at.startsWith(dataFormatada))
                const isSelecionado = diaSelecionado === dataFormatada

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSelecionado(dataFormatada)}
                    className={`relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-all ${
                      isSelecionado 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold scale-105' 
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {dia}
                    {temRecibo && !isSelecionado && (
                      <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-blue-400"></span>
                    )}
                  </button>
                )
              })}
            </div>
            
            {loading && <p className="text-center text-xs text-slate-500 mt-6 animate-pulse">Buscando dados do mês...</p>}
          </div>

          {/* COLUNA DIREITA: OS RECIBOS DO DIA */}
          <div className="lg:col-span-2">
            {!diaSelecionado ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/5 text-slate-500">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Selecione um dia no calendário para ver os recibos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="bg-blue-500 w-2 h-6 rounded-full inline-block"></span>
                  Entregas do dia {diaSelecionado.split('-').reverse().join('/')}
                </h3>

                {recibosDoDiaSelecionado.length === 0 ? (
                  <p className="text-slate-400 italic bg-white/5 p-6 rounded-2xl border border-white/10">Nenhum registro de fardamento para esta data.</p>
                ) : (
                  recibosDoDiaSelecionado.map(req => (
                    <div key={req.id} className="rounded-2xl border border-white/10 bg-[#070b3f]/60 p-6 backdrop-blur-md shadow-xl">
                      
                      {/* Cabeçalho do Card */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">{req.profiles?.nome || 'Técnico Desconhecido'}</p>
                            <p className="text-xs text-slate-400">
                              Hora: {new Date(req.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase border border-emerald-500/20">
                          Assinado
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Lista de Itens */}
                        <div>
                          <h4 className="mb-3 text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <Package size={14} /> Materiais Retirados
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(req.items).map(([nome, info]: any) => (
                              <div key={nome} className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-2 border border-white/5">
                                <span className="text-slate-200 text-sm">{nome}</span>
                                <div className="text-xs text-slate-400">
                                  Qtd: <b className="text-white">{info.qtd}</b> | Tam: <b className="text-white">{info.tam || '-'}</b>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Provas Visuais */}
                        <div>
                           <h4 className="mb-3 text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <PenTool size={14} /> Comprovações Digitais
                          </h4>
                          <div className="flex gap-4">
                            {/* AQUI É ONDE A IMAGEM ESTÁ QUEBRADA - Coloquei um fallback para ficar bonito até você arrumar o Storage */}
                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase text-center">Selfie</p>
                              <div className="aspect-square rounded-xl bg-black/50 border border-white/10 overflow-hidden relative flex items-center justify-center">
                                {req.photo_url === 'url_da_foto.jpg' ? (
                                  <ImageIcon size={24} className="text-slate-600" />
                                ) : (
                                  <img src={req.photo_url} alt="Selfie" className="w-full h-full object-cover" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase text-center">Assinatura</p>
                              <div className="aspect-square rounded-xl bg-white p-2 border border-white/10 overflow-hidden flex items-center justify-center">
                                 {req.signature_url === 'url_da_assinatura.png' ? (
                                  <span className="text-[8px] text-slate-400">Assinatura Simulada</span>
                                ) : (
                                  <img src={req.signature_url} alt="Assinatura" className="w-full h-full object-contain grayscale" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}