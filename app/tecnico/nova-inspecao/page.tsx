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

type Vehicle = { id: string; placa: string; modelo: string }
type Assignment = { vehicle_id: string }

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
        .from('vehicle_assignments').select('vehicle_id')
        .eq('profile_id', userData.user.id).is('ended_at', null)

      const vehicleIds = (assignments as Assignment[] | null)?.map((item) => item.vehicle_id) || []
      if (vehicleIds.length === 0) return

      const { data: vehiclesData } = await supabase
        .from('vehicles').select('id, placa, modelo')
        .in('id', vehicleIds).eq('ativo', true).order('placa', { ascending: true })

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
      inspection_id: inspectionId, photo_type: tipo, file_path: filePath,
      public_url: publicUrl, profile_id: userId,
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
        vehicle_id: vehicleId, profile_id: userId, inspection_date: inspectionDate,
        odometer: Number(odometer), item_triangulo: itemTriangulo, item_macaco: itemMacaco,
        item_chave_roda: itemChaveRoda, item_estepe: itemEstepe, observation_general: observationGeneral,
        motor_oil_level: motorOilLevel, motor_brakes: motorBrakes, motor_suspension: motorSuspension,
        motor_headlights: motorHeadlights, motor_observation: motorObservation,
        cleaning_mats: cleaningMats, cleaning_water: cleaningWater,
        cleaning_windshield: cleaningWindshield, cleaning_bodywork: cleaningBodywork,
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        * { box-sizing: border-box; }

        .insp-root {
          min-height: 100vh;
          background: #080d1a;
          background-image:
            radial-gradient(ellipse 80% 40% at 50% -5%, rgba(37,99,235,0.15) 0%, transparent 65%),
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.018) 79px, rgba(255,255,255,0.018) 80px),
            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.018) 79px, rgba(255,255,255,0.018) 80px);
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          padding: 20px 16px 60px;
        }

        .insp-inner {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* NAV */
        .insp-nav {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 4px;
        }
        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .back-btn:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }
        .insp-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }

        /* PROGRESS BAR */
        .progress-bar-wrap {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .progress-track {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #38bdf8);
          border-radius: 999px;
          width: 20%;
          transition: width 0.4s ease;
        }
        .progress-label {
          font-size: 10px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          white-space: nowrap;
        }

        /* SECTION CARDS */
        .section-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 22px 20px;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        .section-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          margin-bottom: 18px;
        }
        .section-header-dot {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* FIELDS */
        .field-label {
          font-size: 10px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 6px;
          display: block;
        }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }
        .field-input::placeholder { color: #334155; }
        .field-input:focus {
          border-color: rgba(37,99,235,0.5);
          background: rgba(37,99,235,0.06);
        }
        .field-input option { background: #0f172a; color: #e2e8f0; }
        .field-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .field-grid-3 {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 560px) {
          .field-grid-3 { grid-template-columns: 1fr 1fr; }
          .field-grid-3 > *:first-child { grid-column: 1 / -1; }
        }
        .field-textarea {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          resize: vertical;
          min-height: 90px;
          transition: border-color 0.2s, background 0.2s;
        }
        .field-textarea::placeholder { color: #334155; }
        .field-textarea:focus {
          border-color: rgba(37,99,235,0.4);
          background: rgba(37,99,235,0.05);
        }

        /* TOGGLE ITEMS */
        .toggle-grid { display: grid; gap: 10px; }
        .toggle-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .toggle-grid-2 { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 460px) {
          .toggle-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        .toggle-item {
          position: relative;
          padding: 14px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
          -webkit-user-select: none;
        }
        .toggle-item.active-green {
          background: rgba(52,211,153,0.07);
          border-color: rgba(52,211,153,0.3);
        }
        .toggle-item.active-cyan {
          background: rgba(34,211,238,0.07);
          border-color: rgba(34,211,238,0.3);
        }
        .toggle-item-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #475569;
        }
        .toggle-item.active-green .toggle-item-label { color: #6ee7b7; }
        .toggle-item.active-cyan .toggle-item-label { color: #67e8f9; }
        .toggle-check {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          align-self: flex-end;
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .toggle-item.active-green .toggle-check {
          background: rgba(52,211,153,0.2);
          border-color: #34d399;
        }
        .toggle-item.active-cyan .toggle-check {
          background: rgba(34,211,238,0.2);
          border-color: #22d3ee;
        }

        /* MOTOR FIELDS */
        .motor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        @media (max-width: 460px) {
          .motor-grid { grid-template-columns: 1fr; }
        }

        /* FOTO GRID */
        .foto-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 400px) {
          .foto-grid { grid-template-columns: 1fr; }
        }
        .foto-item {}
        .foto-label {
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 6px;
          display: block;
        }
        .foto-zone {
          position: relative;
          height: 110px;
          width: 100%;
          border-radius: 14px;
          border: 1.5px dashed rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          overflow: hidden;
        }
        .foto-zone.has-file {
          border-color: rgba(56,189,248,0.4);
          background: rgba(56,189,248,0.06);
        }
        .foto-zone:hover { border-color: rgba(255,255,255,0.2); }
        .foto-zone.has-file:hover { border-color: rgba(56,189,248,0.6); }
        .foto-zone-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }
        .foto-zone-icon {
          color: #334155;
          transition: color 0.2s;
        }
        .foto-zone.has-file .foto-zone-icon { color: #38bdf8; }
        .foto-zone-text {
          font-size: 9px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .foto-zone.has-file .foto-zone-text { color: #38bdf8; }

        /* ERRO */
        .erro-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
        }

        /* SUBMIT BUTTON */
        .submit-btn {
          width: 100%;
          border: none;
          padding: 0;
          cursor: pointer;
          border-radius: 18px;
          background: none;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .submit-btn:active { transform: scale(0.97); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .submit-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-radius: 18px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          position: relative;
        }
        .submit-btn-inner::before {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 17px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent);
          pointer-events: none;
        }
        .submit-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* NUMBER INPUT NO SPIN */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <main className="insp-root">
        <div className="insp-inner">

          {/* NAV */}
          <div className="insp-nav">
            <button className="back-btn" onClick={() => router.push('/tecnico')}>
              <ChevronLeft size={20} />
            </button>
            <h1 className="insp-title">Nova Inspeção</h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* DADOS DO VEÍCULO */}
            <div className="section-card">
              <div className="section-header" style={{ color: '#60a5fa' }}>
                <div className="section-header-dot" style={{ background: 'rgba(96,165,250,0.15)' }}>
                  <Car size={12} color="#60a5fa" />
                </div>
                Dados do Veículo
              </div>

              <div className="field-grid-3">
                <div>
                  <label className="field-label">Veículo</label>
                  <select
                    className="field-input"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    disabled={veiculos.length <= 1}
                  >
                    <option value="">Selecione...</option>
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Data</label>
                  <input
                    type="date"
                    className="field-input"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Hodômetro</label>
                  <input
                    type="number"
                    placeholder="km"
                    className="field-input"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* CHECKLIST */}
            <div className="section-card">
              <div className="section-header" style={{ color: '#4ade80' }}>
                <div className="section-header-dot" style={{ background: 'rgba(74,222,128,0.12)' }}>
                  <ClipboardCheck size={12} color="#4ade80" />
                </div>
                Checklist de Segurança
              </div>

              <div className="toggle-grid toggle-grid-4" style={{ marginBottom: 14 }}>
                {[
                  { label: 'Triângulo', state: itemTriangulo, set: setItemTriangulo },
                  { label: 'Macaco', state: itemMacaco, set: setItemMacaco },
                  { label: 'Chave Roda', state: itemChaveRoda, set: setItemChaveRoda },
                  { label: 'Estepe', state: itemEstepe, set: setItemEstepe },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`toggle-item ${item.state ? 'active-green' : ''}`}
                    onClick={() => item.set(!item.state)}
                  >
                    <div className="toggle-check">
                      {item.state && <CheckCircle2 size={12} color="#34d399" />}
                    </div>
                    <div className="toggle-item-label">{item.label}</div>
                  </div>
                ))}
              </div>

              <textarea
                className="field-textarea"
                placeholder="Observações de segurança..."
                value={observationGeneral}
                onChange={(e) => setObservationGeneral(e.target.value)}
              />
            </div>

            {/* MOTOR */}
            <div className="section-card">
              <div className="section-header" style={{ color: '#fb923c' }}>
                <div className="section-header-dot" style={{ background: 'rgba(251,146,60,0.12)' }}>
                  <Activity size={12} color="#fb923c" />
                </div>
                Condições do Motor
              </div>

              <div className="motor-grid">
                <div>
                  <label className="field-label">Nível do óleo</label>
                  <input type="text" className="field-input" placeholder="Ex: Normal" value={motorOilLevel} onChange={(e) => setMotorOilLevel(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Freios</label>
                  <input type="text" className="field-input" placeholder="Ex: Bom" value={motorBrakes} onChange={(e) => setMotorBrakes(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Suspensão</label>
                  <input type="text" className="field-input" placeholder="Ex: Normal" value={motorSuspension} onChange={(e) => setMotorSuspension(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Faróis</label>
                  <input type="text" className="field-input" placeholder="Ex: Funcionando" value={motorHeadlights} onChange={(e) => setMotorHeadlights(e.target.value)} />
                </div>
              </div>

              <textarea
                className="field-textarea"
                placeholder="Notas técnicas do motor..."
                value={motorObservation}
                onChange={(e) => setMotorObservation(e.target.value)}
              />
            </div>

            {/* HIGIENIZAÇÃO */}
            <div className="section-card">
              <div className="section-header" style={{ color: '#22d3ee' }}>
                <div className="section-header-dot" style={{ background: 'rgba(34,211,238,0.1)' }}>
                  <Droplets size={12} color="#22d3ee" />
                </div>
                Higienização
              </div>

              <div className="toggle-grid toggle-grid-2" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[
                  { label: 'Tapetes', state: cleaningMats, set: setCleaningMats },
                  { label: 'Água', state: cleaningWater, set: setCleaningWater },
                  { label: 'Para-brisa', state: cleaningWindshield, set: setCleaningWindshield },
                  { label: 'Lataria', state: cleaningBodywork, set: setCleaningBodywork },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`toggle-item ${item.state ? 'active-cyan' : ''}`}
                    onClick={() => item.set(!item.state)}
                  >
                    <div className="toggle-check">
                      {item.state && <CheckCircle2 size={12} color="#22d3ee" />}
                    </div>
                    <div className="toggle-item-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FOTOS */}
            <div className="section-card">
              <div className="section-header" style={{ color: '#818cf8' }}>
                <div className="section-header-dot" style={{ background: 'rgba(129,140,248,0.12)' }}>
                  <Camera size={12} color="#818cf8" />
                </div>
                Registros Fotográficos
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#334155', fontWeight: 600, letterSpacing: '0.1em' }}>6 OBRIGATÓRIAS</span>
              </div>

              <div className="foto-grid">
                {[
                  { label: 'Frente', set: setFotoFrente, file: fotoFrente },
                  { label: 'Fundo', set: setFotoFundo, file: fotoFundo },
                  { label: 'Lat. Direita', set: setFotoLateralDir, file: fotoLateralDir },
                  { label: 'Lat. Esquerda', set: setFotoLateralEsq, file: fotoLateralEsq },
                  { label: 'Hodômetro', set: setFotoHodometro, file: fotoHodometro },
                  { label: 'Ferramentas', set: setFotoFerramentas, file: fotoFerramentas },
                ].map((item) => (
                  <div key={item.label} className="foto-item">
                    <span className="foto-label">{item.label}</span>
                    <div className={`foto-zone ${item.file ? 'has-file' : ''}`}>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => item.set(e.target.files?.[0] || null)}
                        className="foto-zone-input"
                      />
                      <Camera size={20} className="foto-zone-icon" />
                      <span className="foto-zone-text">
                        {item.file ? '✓ Capturada' : 'Tirar foto'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ERRO */}
            {erro && <div className="erro-box">{erro}</div>}

            {/* SUBMIT */}
            <button type="submit" disabled={salvando} className="submit-btn">
              <div className="submit-btn-inner">
                {salvando ? (
                  <>
                    <div className="submit-spinner" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Finalizar Inspeção
                  </>
                )}
              </div>
            </button>

          </form>
        </div>
      </main>
    </>
  )
}
