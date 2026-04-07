import { supabase } from "@/lib/supabase"
import InspectionsAccordion from "./InspectionsAccordion"

type Inspection = Record<string, any>

type Vehicle = {
  id: string
  placa: string
  modelo: string | null
  ativo: boolean
  created_at: string
  ownership_type: string | null
}

const DEFAULT_CAR_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 🔍 Buscar veículo
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single<Vehicle>()

  // 🔥 CORRIGIDO AQUI — agora traz tudo
  const { data: inspections, error: inspectionsError } = await supabase
    .from("inspections")
    .select("*")
    .eq("vehicle_id", id)
    .order("inspection_date", { ascending: false })

  // 🔍 Buscar imagem do modelo
  let imageUrl = DEFAULT_CAR_IMAGE

  if (vehicle?.modelo) {
    const { data: modelData } = await supabase
      .from("vehicle_models")
      .select("image_url")
      .ilike("model_name", vehicle.modelo)
      .single()

    if (modelData?.image_url) {
      imageUrl = modelData.image_url
    }
  }

  // ❌ Erro veículo
  if (vehicleError || !vehicle) {
    return (
      <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-md border border-red-200 bg-red-50 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-red-700">
              Veículo não encontrado
            </h1>
            <p className="mt-2 text-sm text-red-600">
              {vehicleError?.message || "Não foi possível localizar este veículo."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] p-6 text-[#22313f]">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* CARD PRINCIPAL */}
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className="h-32 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100 md:w-48">
                  <img
                    src={imageUrl}
                    alt={vehicle.placa}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Veículo
                  </p>

                  <h1 className="mt-2 text-4xl font-bold text-slate-800">
                    {vehicle.placa}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    {vehicle.modelo || "-"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                        vehicle.ownership_type === "proprio"
                          ? "bg-[#35c6cf]"
                          : "bg-[#6b63b5]"
                      }`}
                    >
                      {vehicle.ownership_type === "proprio"
                        ? "Próprio"
                        : vehicle.ownership_type === "alugado"
                        ? "Alugado"
                        : "-"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                        vehicle.ativo ? "bg-[#38a96a]" : "bg-[#d9534f]"
                      }`}
                    >
                      {vehicle.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID INFO */}
              <div className="grid w-full gap-4 md:grid-cols-2 xl:w-auto xl:min-w-[760px] xl:grid-cols-4">

                <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Placa</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {vehicle.placa}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Modelo</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {vehicle.modelo || "-"}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Tipo</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {vehicle.ownership_type || "-"}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-[#fafbfd] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {vehicle.ativo ? "Ativo" : "Inativo"}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* INSPEÇÕES */}
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Histórico de inspeções
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Clique no mês para expandir as verificações
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {(inspections || []).length} inspeção(ões)
            </div>
          </div>

          <div className="p-6">
            {inspectionsError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Erro ao carregar inspeções: {inspectionsError.message}
              </div>
            ) : (
              <InspectionsAccordion inspections={inspections || []} />
            )}
          </div>
        </div>

      </div>
    </main>
  )
}