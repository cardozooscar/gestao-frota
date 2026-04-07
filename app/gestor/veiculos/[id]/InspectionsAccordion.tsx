"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, XCircle, Camera, Tool, Droplets, ShieldCheck, Activity } from "lucide-react"

type Inspection = Record<string, any>

type Props = {
  inspections: Inspection[]
}

// 1. DICIONÁRIO DE TRADUÇÃO (O fim do inglês na tela)
const LABEL_MAP: Record<string, string> = {
  item_triangulo: "Triângulo",
  item_macaco: "Macaco",
  item_chave_roda: "Chave de Roda",
  item_estepe: "Estepe",
  motor_oil_level: "Nível do Óleo",
  motor_brakes: "Freios",
  motor_suspension: "Suspensão",
  motor_headlights: "Faróis",
  cleaning_mats: "Tapetes",
  cleaning_water: "Água",
  cleaning_windshield: "Para-brisa",
  cleaning_bodywork: "Lataria",
}

function groupInspectionsByMonth(inspections: Inspection[]) {
  return inspections.reduce<Record<string, Inspection[]>>((acc, item) => {
    const date = new Date(item.inspection_date)
    const key = date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    })

    if (!acc[key]) acc[key] = []
    acc[key].push(item)

    return acc
  }, {})
}

export default function InspectionsAccordion({ inspections }: Props) {
  const grouped = useMemo(() => groupInspectionsByMonth(inspections), [inspections])
  const months = Object.entries(grouped)

  const [openMonth, setOpenMonth] = useState<string | null>(
    months.length > 0 ? months[0][0] : null
  )

  if (!inspections.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nenhuma inspeção encontrada para este veículo.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {months.map(([month, items]) => {
        const isOpen = openMonth === month

        return (
          <div key={month} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? null : month)}
              className="flex w-full items-center justify-between bg-slate-50/50 px-6 py-5 text-left transition hover:bg-slate-100"
            >
              <div>
                <h3 className="text-xl font-bold capitalize text-slate-800">{month}</h3>
                <p className="text-sm text-slate-500">{items.length} vistorias realizadas</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                isOpen ? "bg-[#2f6eea] text-white rotate-180" : "bg-slate-200 text-slate-600"
              }`}>
                <Activity size={20} />
              </div>
            </button>

            {isOpen && (
              <div className="divide-y divide-slate-100 px-6 py-2">
                {items.map((inspection) => (
                  <div key={inspection.id} className="py-8 first:pt-4 last:pb-4">
                    
                    {/* CABEÇALHO DA INSPEÇÃO */}
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-[#2f6eea]">
                           <ShieldCheck size={28} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-xs text-slate-500">Realizado por ID: {inspection.profile_id.substring(0,8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded-full bg-slate-900 px-4 py-1.5 text-sm font-black text-white">
                          {inspection.odometer?.toLocaleString()} KM
                        </span>
                      </div>
                    </div>

                    {/* BLOCOS DE INFORMAÇÃO GRUPADOS */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      
                      {/* GRUPO: SEGURANÇA / CHECKLIST */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-700">
                          <Tool size={16} className="text-[#2f6eea]" /> Itens de Segurança
                        </div>
                        <div className="space-y-2">
                          {['item_triangulo', 'item_macaco', 'item_chave_roda', 'item_estepe'].map(key => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">{LABEL_MAP[key]}</span>
                              {inspection[key] ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-400" />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* GRUPO: MOTOR */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-700">
                          <Activity size={16} className="text-orange-500" /> Condições do Motor
                        </div>
                        <div className="space-y-3">
                          {['motor_oil_level', 'motor_brakes', 'motor_suspension', 'motor_headlights'].map(key => (
                            <div key={key} className="text-sm">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{LABEL_MAP[key]}</p>
                              <p className="font-semibold text-slate-700">{inspection[key] || "Não informado"}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* GRUPO: LIMPEZA */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-700">
                          <Droplets size={16} className="text-cyan-500" /> Higienização
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['cleaning_mats', 'cleaning_water', 'cleaning_windshield', 'cleaning_bodywork'].map(key => (
                            <div key={key} className="flex flex-col items-center rounded-lg bg-white p-2 border border-slate-100">
                              <span className="text-[10px] text-slate-500 mb-1">{LABEL_MAP[key]}</span>
                              {inspection[key] ? <span className="text-[10px] font-bold text-emerald-600">OK</span> : <span className="text-[10px] font-bold text-red-500">PENDENTE</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* OBSERVAÇÕES */}
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-blue-50/50 p-4 border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Observações Gerais</p>
                        <p className="text-sm text-slate-700 italic">"{inspection.observation_general || "Sem observações adicionais."}"</p>
                      </div>
                      <div className="rounded-lg bg-orange-50/50 p-4 border border-orange-100">
                        <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Nota Técnica do Motor</p>
                        <p className="text-sm text-slate-700 italic">"{inspection.motor_observation || "Nenhuma anomalia relatada."}"</p>
                      </div>
                    </div>

                    {/* GALERIA DE FOTOS (RENOVADA) */}
                    {inspection.inspection_photos && inspection.inspection_photos.length > 0 && (
                      <div className="mt-8">
                        <div className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                          <Camera size={18} className="text-[#2f6eea]" /> Registros Fotográficos
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                          {inspection.inspection_photos.map((photo: any) => (
                            <div key={photo.id} className="group relative">
                              <a href={photo.public_url} target="_blank" rel="noreferrer" className="block">
                                <div className="aspect-square overflow-hidden rounded-xl border-2 border-slate-100 transition-all group-hover:border-[#2f6eea] group-hover:shadow-lg">
                                  <img 
                                    src={photo.public_url} 
                                    alt={photo.photo_type} 
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                  />
                                </div>
                                <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-tight text-slate-500 group-hover:text-[#2f6eea]">
                                  {photo.photo_type.replace('_', ' ')}
                                </p>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RODAPÉ DO REGISTRO */}
                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4 text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                      <span>Protocolo: {inspection.id}</span>
                      <span>Registrado em {new Date(inspection.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}