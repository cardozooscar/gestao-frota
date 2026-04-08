import { supabase } from "@/lib/supabase"
import InspectionsAccordion from "./InspectionsAccordion"
import { Car, Settings2, AlertCircle, FileText, ChevronLeft } from "lucide-react"
import Link from "next/link"

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

  // 🔥 Buscar Inspeções
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
      <main className="min-h-screen bg-[#02052b] flex flex-col items-center justify-center text-white p-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Veículo não encontrado</h1>
        <p className="text-sm text-slate-400 max-w-md text-center">
          {vehicleError?.message || "Não foi possível localizar este veículo no banco de dados."}
        </p>
        <Link href="/gestor/veiculos" className="mt-6 text-blue-400 font-bold hover:underline">
          Voltar para frota
        </Link>
      </main>
    )
  }

  const isAtivo = vehicle.ativo

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER COM BOTÃO VOLTAR */}
        <div className="flex items-center gap-4">
          <Link 
            href="/gestor/veiculos"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Car size={14} /> Ficha do Veículo
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">{vehicle.placa}</h1>
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Foto do Veículo (Fallback inteligente mantido) */}
            <div className="w-full lg:w-1/3 aspect-video relative rounded-2xl overflow-hidden bg-[#070b3f] border border-white/10 shadow-2xl">
              <img 
                src={imageUrl} 
                alt={vehicle.placa} 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${vehicle.ownership_type === 'proprio' ? 'bg-[#35c6cf]/90 text-white' : 'bg-[#6b63b5]/90 text-white'}`}>
                  {vehicle.ownership_type === 'proprio' ? 'Próprio' : vehicle.ownership_type === 'alugado' ? 'Alugado' : 'Não definido'}
                </span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${isAtivo ? 'bg-[#38a96a]/90 text-white' : 'bg-[#d9534f]/90 text-white'}`}>
                  {isAtivo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            {/* Informações (Grid) */}
            <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              
              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5 md:col-span-2 lg:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
                  <Car size={12} /> Veículo
                </p>
                <p className="text-xl font-black text-white truncate">{vehicle.placa}</p>
                <p className="text-sm font-medium text-slate-400 mt-1 truncate">{vehicle.modelo || "-"}</p>
              </div>

              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
                  <Settings2 size={12} /> Placa
                </p>
                <p className="text-xl font-black text-white mt-1">{vehicle.placa}</p>
              </div>

              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tipo</p>
                <p className="text-lg font-bold text-white capitalize mt-1">
                  {vehicle.ownership_type || "-"}
                </p>
              </div>

              <div className="bg-[#070b3f] border border-white/5 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</p>
                <p className={`text-lg font-bold mt-1 ${isAtivo ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isAtivo ? "Ativo" : "Inativo"}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* INSPEÇÕES COM O SEU COMPONENTE */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <FileText size={20} className="text-blue-400" /> Histórico de inspeções
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Clique no mês para expandir os laudos detalhados
              </p>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-400">
              {(inspections || []).length} inspeção(ões)
            </div>
          </div>

          <div className="mt-6">
            {inspectionsError ? (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                Erro ao carregar inspeções: {inspectionsError.message}
              </div>
            ) : (
              // Como o InspectionsAccordion tem o seu próprio estilo (possivelmente branco/cinza),
              // deixamos ele rodar normalmente. Se você já converteu ele para dark mode,
              // vai encaixar perfeitamente aqui!
              <div className="dark-theme-wrapper">
                <InspectionsAccordion inspections={inspections || []} />
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}