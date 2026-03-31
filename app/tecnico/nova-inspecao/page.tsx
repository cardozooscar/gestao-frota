'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

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
  const [inspectionDate, setInspectionDate] = useState('')
  const [odometer, setOdometer] = useState('')

  const [itemTriangulo, setItemTriangulo] = useState(false)
  const [itemMacaco, setItemMacaco] = useState(false)
  const [itemChaveRoda, setItemChaveRoda] = useState(false)
  const [itemEstepe, setItemEstepe] = useState(false)
  const [observationGeneral, setObservationGeneral] = useState('')

  const [tireFrontRight, setTireFrontRight] = useState('')
  const [tireFrontLeft, setTireFrontLeft] = useState('')
  const [tireRearRight, setTireRearRight] = useState('')
  const [tireRearLeft, setTireRearLeft] = useState('')

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

  useEffect(() => {
    async function loadInitialData() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: assignments, error: vinculoError } = await supabase
        .from('vehicle_assignments')
        .select('vehicle_id')
        .eq('profile_id', userData.user.id)
        .is('ended_at', null)

      if (vinculoError) {
        setErro('Erro ao carregar veículo liberado: ' + vinculoError.message)
        return
      }

      const vehicleIds = (assignments as Assignment[] | null)?.map((item) => item.vehicle_id) || []

      if (vehicleIds.length === 0) {
        setVeiculos([])
        setVehicleId('')
        return
      }

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, placa, modelo')
        .in('id', vehicleIds)
        .order('placa', { ascending: true })

      if (vehiclesError) {
        setErro('Erro ao carregar veículo liberado: ' + vehiclesError.message)
        return
      }

      const lista = (vehiclesData as Vehicle[]) || []

      setVeiculos(lista)

      if (lista.length === 1) {
        setVehicleId(lista[0].id)
      }
    }

    loadInitialData()
  }, [router])

  async function uploadFoto(
    file: File,
    tipo: 'frente' | 'fundo' | 'lateral_direita' | 'lateral_esquerda' | 'hodometro',
    inspectionId: string,
    userId: string
  ) {
    const extensao = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${inspectionId}/${tipo}_${Date.now()}.${extensao}`

    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erro ao subir foto ${tipo}: ${uploadError.message}`)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('inspection-photos').getPublicUrl(filePath)

    const { error: insertPhotoError } = await supabase.from('inspection_photos').insert({
      inspection_id: inspectionId,
      photo_type: tipo,
      file_path: filePath,
      public_url: publicUrl,
      profile_id: userId,
    })

    if (insertPhotoError) {
      throw new Error(`Erro ao registrar foto ${tipo}: ${insertPhotoError.message}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!vehicleId) {
      setErro('Nenhum veículo foi liberado para você.')
      return
    }

    if (!inspectionDate) {
      setErro('Informe a data da inspeção.')
      return
    }

    if (!odometer) {
      setErro('Informe o hodômetro.')
      return
    }

    setSalvando(true)

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error('Usuário não autenticado.')
      }

      const userId = userData.user.id

      const { data: insertData, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: vehicleId,
          profile_id: userId,
          inspection_date: inspectionDate,
          odometer: Number(odometer),

          item_triangulo: itemTriangulo,
          item_macaco: itemMacaco,
          item_chave_roda: itemChaveRoda,
          item_estepe: itemEstepe,
          observation_general: observationGeneral,

          tire_front_right: tireFrontRight ? Number(tireFrontRight) : null,
          tire_front_left: tireFrontLeft ? Number(tireFrontLeft) : null,
          tire_rear_right: tireRearRight ? Number(tireRearRight) : null,
          tire_rear_left: tireRearLeft ? Number(tireRearLeft) : null,

          motor_oil_level: motorOilLevel,
          motor_brakes: motorBrakes,
          motor_suspension: motorSuspension,
          motor_headlights: motorHeadlights,
          motor_observation: motorObservation,

          cleaning_mats: cleaningMats,
          cleaning_water: cleaningWater,
          cleaning_windshield: cleaningWindshield,
          cleaning_bodywork: cleaningBodywork,
        })
        .select()
        .single()

      if (inspectionError || !insertData) {
        throw new Error(inspectionError?.message || 'Erro ao salvar inspeção.')
      }

      const inspectionId = insertData.id

      if (fotoFrente) await uploadFoto(fotoFrente, 'frente', inspectionId, userId)
      if (fotoFundo) await uploadFoto(fotoFundo, 'fundo', inspectionId, userId)
      if (fotoLateralDir) await uploadFoto(fotoLateralDir, 'lateral_direita', inspectionId, userId)
      if (fotoLateralEsq) await uploadFoto(fotoLateralEsq, 'lateral_esquerda', inspectionId, userId)
      if (fotoHodometro) await uploadFoto(fotoHodometro, 'hodometro', inspectionId, userId)

      router.push('/tecnico')
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao salvar inspeção.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#02052b] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nova Inspeção</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Informações básicas</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2">Veículo liberado</label>
                <select
                  className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  disabled={veiculos.length <= 1}
                >
                  <option value="">Selecione</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.modelo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Data</label>
                <input
                  type="date"
                  className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Hodômetro</label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Checklist do carro</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={itemTriangulo} onChange={(e) => setItemTriangulo(e.target.checked)} /> Triângulo</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={itemMacaco} onChange={(e) => setItemMacaco(e.target.checked)} /> Macaco</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={itemChaveRoda} onChange={(e) => setItemChaveRoda(e.target.checked)} /> Chave de roda</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={itemEstepe} onChange={(e) => setItemEstepe(e.target.checked)} /> Estepe</label>
            </div>

            <div className="mt-4">
              <label className="block mb-2">Observação geral</label>
              <textarea
                className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3 min-h-28 outline-none"
                value={observationGeneral}
                onChange={(e) => setObservationGeneral(e.target.value)}
              />
            </div>
          </section>

          <section className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Calibragem dos pneus</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="number" step="0.01" placeholder="Dianteiro direito" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={tireFrontRight} onChange={(e) => setTireFrontRight(e.target.value)} />
              <input type="number" step="0.01" placeholder="Dianteiro esquerdo" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={tireFrontLeft} onChange={(e) => setTireFrontLeft(e.target.value)} />
              <input type="number" step="0.01" placeholder="Traseiro direito" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={tireRearRight} onChange={(e) => setTireRearRight(e.target.value)} />
              <input type="number" step="0.01" placeholder="Traseiro esquerdo" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={tireRearLeft} onChange={(e) => setTireRearLeft(e.target.value)} />
            </div>
          </section>

          <section className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Motor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Nível do óleo" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={motorOilLevel} onChange={(e) => setMotorOilLevel(e.target.value)} />
              <input type="text" placeholder="Freios" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={motorBrakes} onChange={(e) => setMotorBrakes(e.target.value)} />
              <input type="text" placeholder="Suspensão" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={motorSuspension} onChange={(e) => setMotorSuspension(e.target.value)} />
              <input type="text" placeholder="Farol" className="rounded-lg bg-[#050827] border border-[#1d2466] p-3 outline-none" value={motorHeadlights} onChange={(e) => setMotorHeadlights(e.target.value)} />
            </div>

            <div className="mt-4">
              <label className="block mb-2">Observação do motor</label>
              <textarea
                className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3 min-h-28 outline-none"
                value={motorObservation}
                onChange={(e) => setMotorObservation(e.target.value)}
              />
            </div>
          </section>

          <section className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Limpeza</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={cleaningMats} onChange={(e) => setCleaningMats(e.target.checked)} /> Tapetes</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={cleaningWater} onChange={(e) => setCleaningWater(e.target.checked)} /> Água</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={cleaningWindshield} onChange={(e) => setCleaningWindshield(e.target.checked)} /> Para-brisa</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={cleaningBodywork} onChange={(e) => setCleaningBodywork(e.target.checked)} /> Lataria</label>
            </div>
          </section>

          <section className="bg-[#070b3f] border border-[#1d2466] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Fotos do veículo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Foto da frente</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoFrente(e.target.files?.[0] || null)} className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3" />
              </div>

              <div>
                <label className="block mb-2">Foto do fundo</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoFundo(e.target.files?.[0] || null)} className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3" />
              </div>

              <div>
                <label className="block mb-2">Foto lateral direita</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoLateralDir(e.target.files?.[0] || null)} className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3" />
              </div>

              <div>
                <label className="block mb-2">Foto lateral esquerda</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoLateralEsq(e.target.files?.[0] || null)} className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3" />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2">Foto do hodômetro</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoHodometro(e.target.files?.[0] || null)} className="w-full rounded-lg bg-[#050827] border border-[#1d2466] p-3" />
              </div>
            </div>
          </section>

          {erro && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-lg p-3">
              {erro}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={salvando} className="bg-[#2f6eea] hover:bg-[#255ed0] disabled:opacity-60 rounded-lg px-5 py-3 font-semibold">
              {salvando ? 'Salvando...' : 'Salvar inspeção'}
            </button>

            <button type="button" onClick={() => router.push('/tecnico')} className="bg-[#1d2466] hover:bg-[#28318a] rounded-lg px-5 py-3 font-semibold">
              Voltar
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}