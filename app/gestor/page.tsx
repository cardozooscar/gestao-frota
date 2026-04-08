import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import HodometroTotalChart from './HodometroTotalChart'
import HodometroMensalChart from './HodometroMensalChart'
import { 
  Car, 
  CheckCircle2, 
  ClipboardList, 
  AlertTriangle, 
  Bell, 
  LayoutDashboard,
  TrendingUp,
  History,
  UserPlus
} from 'lucide-react'

export const revalidate = 0

// Tipagens
type Vehicle = { id: string; placa: string; modelo: string | null; ativo: boolean | null; is_active: boolean | null }
type Profile = { id: string; nome: string; username: string; role: 'admin' | 'supervisor' | 'tecnico'; approved: boolean; active: boolean }
type Inspection = { id: string; inspection_date: string; vehicle_id: string; odometer: number | null; created_at: string }
type VehicleCurrentOdometer = { vehicle_id: string; placa: string; modelo: string | null; odometer: number; inspection_date: string }

function isVehicleActive(vehicle: Vehicle) {
  return vehicle.ativo === true || vehicle.is_active === true
}

function getDaysDifference(dateString: string) {
  const target = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default async function GestorHomePage() {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [vehiclesRes, inspectionsRes, pendingTechsRes] = await Promise.all([
    supabase.from('vehicles').select('id, placa, modelo, ativo, is_active').order('created_at', { ascending: false }),
    supabase.from('inspections').select('id, inspection_date, vehicle_id, odometer, created_at').order('inspection_date', { ascending: false }),
    supabase.from('profiles').select('id, nome, username, role, approved, active').eq('role', 'tecnico').eq('approved', false)
  ])

  const vehicles = (vehiclesRes.data || []) as Vehicle[]
  const inspections = (inspectionsRes.data || []) as Inspection[]
  const pendingTechs = (pendingTechsRes.data || []) as Profile[]

  const vehiclesAtivosList = vehicles.filter((v) => isVehicleActive(v))
  
  const latestInspectionByVehicle = new Map<string, Inspection>()
  for (const inspection of inspections) {
    if (!latestInspectionByVehicle.has(inspection.vehicle_id)) latestInspectionByVehicle.set(inspection.vehicle_id, inspection)
  }

  // LÓGICA DE ALERTAS
  const veiculosSemInspecao = vehiclesAtivosList.filter(v => !latestInspectionByVehicle.has(v.id))
  const veiculosInspecaoAtrasada = vehiclesAtivosList.filter(v => {
    const latest = latestInspectionByVehicle.get(v.id)
    return latest ? getDaysDifference(latest.inspection_date) > 30 : false
  })

  // Soma total correta para o Badge
  const totalAlertas = veiculosSemInspecao.length + veiculosInspecaoAtrasada.length + pendingTechs.length

  const currentOdometerRanking = vehiclesAtivosList.map(v => {
    const latest = inspections.find(i => i.vehicle_id === v.id && i.odometer !== null)
    return latest ? { vehicle_id: v.id, placa: v.placa, modelo: v.modelo, odometer: latest.odometer || 0, inspection_date: latest.inspection_date } : null
  }).filter((i): i is VehicleCurrentOdometer => i !== null).sort((a, b) => b.odometer - a.odometer).slice(0, 8)

  return (
    <div className="min-h-screen bg-[#02052b] text-white p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER - CORREÇÃO DE Z-INDEX APLICADA AQUI (relative z-50) */}
        <div className="relative z-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <LayoutDashboard size={14} /> Sistema de Gestão
            </div>
            <h1 className="text-3xl font-black tracking-tight">Painel de Controle</h1>
            <p className="text-slate-400 text-sm">Monitoramento em tempo real da frota Fibranet Brasil.</p>
          </div>

          <div className="flex items-center gap-4">
            <details className="relative group">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold transition hover:bg-white/10">
                <Bell size={18} className={totalAlertas > 0 ? "text-orange-400 animate-pulse" : "text-slate-400"} />
                Notificações
                <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-lg px-1.5 text-[11px] font-black ${totalAlertas > 0 ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {totalAlertas}
                </span>
              </summary>
              
              <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-3xl border border-white/10 bg-[#070b3f] shadow-2xl backdrop-blur-xl">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Alertas Operacionais</p>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {totalAlertas === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-500">Tudo em ordem na frota.</p>
                  ) : (
                    <>
                      {/* 1. Alertas de Veículos Sem Inspeção */}
                      {veiculosSemInspecao.map(v => (
                        <Link key={v.id} href={`/gestor/veiculos/${v.id}`} className="block p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                          <p className="text-xs font-bold text-red-400 flex items-center gap-2">
                            <AlertTriangle size={12} /> {v.placa} sem inspeção
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Nenhum registro encontrado no banco.</p>
                        </Link>
                      ))}

                      {/* 2. Alertas de Inspeção Atrasada (>30 dias) */}
                      {veiculosInspecaoAtrasada.map(v => {
                         const latest = latestInspectionByVehicle.get(v.id)
                         const dias = latest ? getDaysDifference(latest.inspection_date) : 0
                         return (
                          <Link key={v.id} href={`/gestor/veiculos/${v.id}`} className="block p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                            <p className="text-xs font-bold text-orange-400 flex items-center gap-2">
                              <History size={12} /> {v.placa} atrasada
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">Última vistoria realizada há {dias} dias.</p>
                          </Link>
                         )
                      })}

                      {/* 3. Alertas de Novos Técnicos para Aprovação */}
                      {pendingTechs.map(t => (
                        <Link key={t.id} href="/gestor/aprovacoes" className="block p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                          <p className="text-xs font-bold text-purple-400 flex items-center gap-2">
                            <UserPlus size={12} /> Novo Técnico: {t.nome}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Aguardando aprovação de cadastro.</p>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* RESTANTE DOS CARDS E GRÁFICOS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-blue-600/5 p-6 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Veículos</p>
            <p className="mt-2 text-4xl font-black tracking-tighter">{vehicles.length}</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 p-6 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ativos</p>
            <p className="mt-2 text-4xl font-black tracking-tighter">{vehiclesAtivosList.length}</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600/20 to-purple-600/5 p-6 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inspeções</p>
            <p className="mt-2 text-4xl font-black tracking-tighter">{inspections.length}</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-600/20 to-orange-600/5 p-6 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Alertas</p>
            <p className="mt-2 text-4xl font-black tracking-tighter">{totalAlertas}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
              <TrendingUp size={20} className="text-blue-400" /> Hodômetro Total
            </h2>
            <HodometroTotalChart data={currentOdometerRanking} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm flex items-center justify-center">
             <p className="text-slate-500 italic text-sm">Selecione um veículo para ver detalhes mensais.</p>
          </div>
        </div>

      </div>
    </div>
  )
}