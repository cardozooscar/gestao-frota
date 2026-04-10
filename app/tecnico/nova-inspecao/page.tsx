'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Car, 
  Calendar, 
  Gauge, 
  ClipboardCheck, 
  Activity, 
  Droplets, 
  Camera, 
  ChevronLeft,
  Save,
  CheckCircle2
} from 'lucide-react'

type Vehicle = {
  id: string
  placa: string
  modelo: string
}

type Assignment = {
  vehicle_id: string
}

export default function NovaInspecaoPage() {
  const router = useRouter()

  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [vehicleId, setVehicleId] = useState('')
  const [inspectionDate, setInspectionDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [odometer, setOdometer] = useState('')

  const [itemTriangulo, setItemTriangulo] = useState(false)
  const [itemMacaco, setItemMacaco] = useState(false)
  const [itemChaveRoda, setItemChaveRoda] = useState(false)
  const [itemEstepe, setItemEstepe] = useState(false)
  const [observationGeneral, setObservationGeneral] = useState('')

  const [motorOilLevel, setMotorOilLevel] = useState('')
  const [motorBrakes, setMotorBrakes] = useState('')
  const [motorSuspension, setMotorSuspension] = useState('')
  const [motorHeadlights, setMotorHeadlights] = useState('')
  const [motorObservation, setMotorObservation] = useState('')

  const [cleaningMats, setCleaningMats] = useState(false)
  const [cleaningWater, setCleaningWater] = useState(false)
  const [cleaningWindshield, setCleaningWindshield] = useState(false)
  const [cleaningBodywork, setCleaningBodywork] = useState(false)

  const [fotoFrente, setFotoFrente] = useState<File | null>(null)
  const [fotoFundo, setFotoFundo] = useState<File | null>(null)
  const [fotoLateralDir, setFotoLateralDir] = useState<File | null>(null)
  const [fotoLateralEsq, setFotoLateralEsq] = useState<File | null>(null)
  const [fotoHodometro, setFotoHodometro] = useState<File | null>(null)
  const [fotoFerramentas, setFotoFerramentas] = useState<File | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: assignments } = await supabase
        .from('vehicle_assignments')
        .select('vehicle_id')
        .eq('profile_id', userData.user.id)
        .is('ended_at', null)

      const vehicleIds = (assignments as Assignment[] | null)?.map((item) => item.vehicle_id) || []
      if (vehicleIds.length === 0) return

      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, placa, modelo')
        .in('id', vehicleIds)
        .eq('ativo', true)
        .order('placa', { ascending: true })

      const lista = (vehiclesData as Vehicle[]) || []
      setVeiculos(lista)
      if (lista.length === 1) setVehicleId(lista[0].id)
    }
    loadInitialData()
  }, [router])

  async function uploadFoto(file: File, tipo: string, inspectionId: string, userId: string) {
    const extensao = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${inspectionId}/${tipo}_${Date.now()}.${extensao}`
    await supabase.storage.from('inspection-photos').upload(filePath, file)
    const { data: { publicUrl } } = supabase.storage.from('inspection-photos').getPublicUrl(filePath)
    await supabase.from('inspection_photos').insert({
      inspection_id: inspectionId,
      photo_type: tipo,
      file_path: filePath,
      public_url: publicUrl,
      profile_id: userId,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setSalvando(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado.')
      const userId = userData.user.id

      const { data: insertData, error: inspectionError } = await supabase.from('inspections').insert({
        vehicle_id: vehicleId, profile_id: userId, inspection_date: inspectionDate, odometer: Number(odometer),
        item_triangulo: itemTriangulo, item_macaco: itemMacaco, item_chave_roda: itemChaveRoda, item_estepe: itemEstepe,
        observation_general: observationGeneral, motor_oil_level: motorOilLevel, motor_brakes: motorBrakes,
        motor_suspension: motorSuspension, motor_headlights: motorHeadlights, motor_observation: motorObservation,
        cleaning_mats: cleaningMats, cleaning_water: cleaningWater, cleaning_windshield: cleaningWindshield, cleaning_bodywork: cleaningBodywork,
      }).select().single()

      if (inspectionError || !insertData) throw new Error(inspectionError?.message || 'Erro ao salvar.')
      const inspectionId = insertData.id

      if (fotoFrente) await uploadFoto(fotoFrente, 'frente', inspectionId, userId)
      if (fotoFundo) await uploadFoto(fotoFundo, 'fundo', inspectionId, userId)
      if (fotoLateralDir) await uploadFoto(fotoLateralDir, 'lateral_direita', inspectionId, userId)
      if (fotoLateralEsq) await uploadFoto(fotoLateralEsq, 'lateral_esquerda', inspectionId, userId)
      if (fotoHodometro) await uploadFoto(fotoHodometro, 'hodometro', inspectionId, userId)
      if (fotoFerramentas) await uploadFoto(fotoFerramentas, 'ferramentas', inspectionId, userId)

      router.push('/tecnico')
    } catch (err: any) { setErro(err.message || 'Erro inesperado.'); setSalvando(false) }
  }

  return (
    <main className="min-h-screen bg-[#02052b] text-white p-4 pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* HEADER COM VOLTAR */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/tecnico')} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight">Nova Inspeção</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SEÇÃO: BÁSICO */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-widest mb-2">
              <Car size={16} /> Dados do Veículo
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 ml-1">Veículo</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
                  value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required disabled={veiculos.length <= 1}
                >
                  <option value="" className="bg-[#02052b]">Selecione...</option>
                  {veiculos.map((v) => <option key={v.id} value={v.id} className="bg-[#02052b]">{v.placa} - {v.modelo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Data</label>
                  <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Hodômetro</label>
                  <input type="number" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500" value={odometer} onChange={(e) => setOdometer(e.target.value)} required />
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO: CHECKLIST */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest mb-6">
              <ClipboardCheck size={16} /> Checklist de Segurança
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[ 
                {label: 'Triângulo', state: itemTriangulo, set: setItemTriangulo},
                {label: 'Macaco', state: itemMacaco, set: setItemMacaco},
                {label: 'Chave Roda', state: itemChaveRoda, set: setItemChaveRoda},
                {label: 'Estepe', state: itemEstepe, set: setItemEstepe}
              ].map((item) => (
                <button 
                  key={item.label} type="button" onClick={() => item.set(!item.state)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.state ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <span className="text-xs font-bold uppercase">{item.label}</span>
                  {item.state && <CheckCircle2 size={16} />}
                </button>
              ))}
            </div>
            <textarea 
              placeholder="Observações de segurança..." className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 min-h-[100px]"
              value={observationGeneral} onChange={(e) => setObservationGeneral(e.target.value)}
            />
          </section>

          {/* SEÇÃO: MOTOR */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-orange-400 font-bold uppercase text-xs tracking-widest mb-6">
              <Activity size={16} /> Condições do Motor
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nível do óleo" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-orange-500" value={motorOilLevel} onChange={(e) => setMotorOilLevel(e.target.value)} />
              <input type="text" placeholder="Freios" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-orange-500" value={motorBrakes} onChange={(e) => setMotorBrakes(e.target.value)} />
              <input type="text" placeholder="Suspensão" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-orange-500" value={motorSuspension} onChange={(e) => setMotorSuspension(e.target.value)} />
              <input type="text" placeholder="Faróis" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-orange-500" value={motorHeadlights} onChange={(e) => setMotorHeadlights(e.target.value)} />
            </div>
            <textarea 
              placeholder="Notas técnicas do motor..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-orange-500 min-h-[100px]"
              value={motorObservation} onChange={(e) => setMotorObservation(e.target.value)}
            />
          </section>

          {/* SEÇÃO: LIMPEZA */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-widest mb-6">
              <Droplets size={16} /> Higienização
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[ 
                {label: 'Tapetes', state: cleaningMats, set: setCleaningMats},
                {label: 'Água', state: cleaningWater, set: setCleaningWater},
                {label: 'Para-brisa', state: cleaningWindshield, set: setCleaningWindshield},
                {label: 'Lataria', state: cleaningBodywork, set: setCleaningBodywork}
              ].map((item) => (
                <button 
                  key={item.label} type="button" onClick={() => item.set(!item.state)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.state ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <span className="text-xs font-bold uppercase">{item.label}</span>
                  {item.state && <CheckCircle2 size={16} />}
                </button>
              ))}
            </div>
          </section>

          {/* SEÇÃO: FOTOS */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-widest mb-6">
              <Camera size={16} /> Registros Fotográficos
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {label: 'Frente', set: setFotoFrente, file: fotoFrente},
                {label: 'Fundo', set: setFotoFundo, file: fotoFundo},
                {label: 'Lat. Direita', set: setFotoLateralDir, file: fotoLateralDir},
                {label: 'Lat. Esquerda', set: setFotoLateralEsq, file: fotoLateralEsq},
                {label: 'Hodômetro', set: setFotoHodometro, file: fotoHodometro},
                {label: 'Ferramentas', set: setFotoFerramentas, file: fotoFerramentas}
              ].map((item) => (
                <div key={item.label} className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">{item.label}</label>
                  <div className={`relative flex items-center justify-center h-32 w-full rounded-2xl border-2 border-dashed transition-all ${item.file ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/20'}`}>
                    {/* ADICIONADO capture="environment" AQUI */}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={(e) => item.set(e.target.files?.[0] || null)} 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Camera size={24} />
                      <span className="text-[10px] font-bold uppercase">{item.file ? 'Foto Selecionada' : 'Clique para tirar'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 text-sm font-bold text-center">
              {erro}
            </div>
          )}

          {/* BOTÃO SALVAR */}
          <button 
            type="submit" disabled={salvando}
            className="group flex items-center justify-center gap-3 w-full bg-[#2f6eea] hover:bg-[#255ed0] text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {salvando ? 'PROCESSANDO...' : <><Save size={20} /> FINALIZAR INSPEÇÃO</>}
          </button>

        </form>
      </div>
    </main>
  )
}