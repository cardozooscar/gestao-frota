"use client"

import { useMemo, useState } from "react"

type Inspection = Record<string, any>

type Props = {
  inspections: Inspection[]
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
      <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4 text-sm text-slate-500">
        Nenhuma inspeção encontrada para este veículo.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {months.map(([month, items]) => {
        const isOpen = openMonth === month

        return (
          <div
            key={month}
            className="overflow-hidden rounded-md border border-slate-200 bg-[#fafbfd]"
          >
            <button
              type="button"
              onClick={() => setOpenMonth(isOpen ? null : month)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-100"
            >
              <div>
                <h3 className="text-lg font-bold capitalize text-slate-800">
                  {month}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {items.length} inspeção(ões)
                </p>
              </div>

              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${
                  isOpen
                    ? "bg-[#2f6eea] text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isOpen ? "−" : "+"}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-200 px-5 py-4">
                <div className="space-y-4">
                  {items.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      {/* HEADER */}
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-medium text-slate-700">
                          {new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}
                        </div>

                        <div className="rounded-full bg-[#2f6eea]/10 px-3 py-1 text-sm font-bold text-[#2f6eea]">
                          {inspection.odometer ?? "-"} km
                        </div>
                      </div>

                      {/* OBSERVAÇÕES */}
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Observação geral
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {inspection.observation_general?.trim() || "-"}
                          </p>
                        </div>

                        <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Observação do motor
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {inspection.motor_observation?.trim() || "-"}
                          </p>
                        </div>
                      </div>

                      {/* CAMPOS DINÂMICOS (🔥 AQUI É O PULO DO GATO) */}
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {Object.entries(inspection)
                          .filter(([key, value]) => {
                            // ignora campos já tratados
                            const ignore = [
                              "id",
                              "inspection_date",
                              "odometer",
                              "observation_general",
                              "motor_observation",
                              "created_at",
                              "vehicle_id",
                            ]
                            return !ignore.includes(key) && value !== null && value !== ""
                          })
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="rounded-md border border-slate-200 bg-[#fafbfd] p-3"
                            >
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                {key.replaceAll("_", " ")}
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                {String(value)}
                              </p>
                            </div>
                          ))}
                      </div>

                      {/* RODAPÉ */}
                      <div className="mt-4 text-xs text-slate-400">
                        Registro criado em{" "}
                        {new Date(inspection.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}