'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Car, FileText, Camera, LogOut, ChevronRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TecnicoDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [veiculoAtivo, setVeiculoAtivo] = useState<any>(null)
  const [ultimasInspecoes, setUltimasInspecoes] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.push('/login'); return }

        const { data: profile } = await supabase
          .from('profiles').select('nome, username').eq('id', user.id).maybeSingle()
        setUserProfile(profile)

        const { data: assignment } = await supabase
          .from('vehicle_assignments').select('vehicle_id')
          .eq('profile_id', user.id).is('ended_at', null).maybeSingle()

        if (assignment?.vehicle_id) {
          const { data: vehicleData } = await supabase
            .from('vehicles').select('placa, modelo').eq('id', assignment.vehicle_id).single()
          setVeiculoAtivo(vehicleData)
        }

        const { data: inspections } = await supabase
          .from('inspections').select('id, inspection_date, vehicle_id')
          .eq('profile_id', user.id).order('inspection_date', { ascending: false }).limit(3)

        if (inspections && inspections.length > 0) {
          const formattedInspections = await Promise.all(inspections.map(async (ins) => {
            const { data: v } = await supabase.from('vehicles').select('placa').eq('id', ins.vehicle_id).single()
            return { ...ins, placa: v?.placa || 'Desconhecido' }
          }))
          setUltimasInspecoes(formattedInspections)
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // CORREÇÃO: Função blindada contra fuso horário e carimbos de tempo (Timestamps)
  const formatarDataSegura = (dataString: string) => {
    if (!dataString) return 'Data Inválida'
    
    // Corta qualquer horário (T00:00:00Z) e pega só a parte YYYY-MM-DD
    const dataSemHora = dataString.split('T')[0]
    const parts = dataSemHora.split('-')
    
    if (parts.length >= 3) {
      // Cria a data forçando o fuso local do aparelho
      const dataLocal = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      return dataLocal.toLocaleDateString('pt-BR')
    }
    return dataString
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080d1a' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(56,189,248,0.15)',
          borderTopColor: '#38bdf8',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        * { box-sizing: border-box; }

        .dash-root {
          min-height: 100vh;
          background: #080d1a;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,100,220,0.18) 0%, transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.02) 79px, rgba(255,255,255,0.02) 80px),
            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.02) 79px, rgba(255,255,255,0.02) 80px);
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          padding: 20px 16px 60px;
        }

        .dash-inner {
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* HEADER */
        .header-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 18px 20px;
          backdrop-filter: blur(12px);
        }
        .header-greeting {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 4px;
        }
        .header-name {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .header-username {
          font-size: 11px;
          color: #38bdf8;
          font-weight: 500;
          margin-top: 5px;
          letter-spacing: 0.02em;
        }
        .logout-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.15);
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .logout-btn:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.3); }

        /* VEHICLE CARD */
        .vehicle-card {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          padding: 28px 24px;
        }
        .vehicle-card-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%);
        }
        .vehicle-card-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
          background-size: 150px;
          opacity: 0.4;
          mix-blend-mode: overlay;
        }
        .vehicle-card-shine {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%);
          border-radius: 50%;
        }
        .vehicle-tag {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.22em;
          margin-bottom: 16px;
        }
        .vehicle-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7dd3fc;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .vehicle-placa {
          position: relative;
          z-index: 2;
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.04em;
          line-height: 1;
        }
        .vehicle-modelo {
          position: relative;
          z-index: 2;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-top: 8px;
        }
        .vehicle-no-car {
          position: relative;
          z-index: 2;
        }
        .vehicle-no-car p:first-child {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
        .vehicle-no-car p:last-child {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 4px;
        }
        .vehicle-icon-bg {
          position: absolute;
          right: -20px;
          bottom: -20px;
          z-index: 1;
          color: rgba(255,255,255,0.06);
        }

        /* STATUS GRID */
        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .status-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 20px 18px;
          position: relative;
          overflow: hidden;
        }
        .status-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .status-value {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .status-label {
          font-size: 9px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-top: 5px;
        }
        .status-corner {
          position: absolute;
          top: -24px;
          right: -24px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          opacity: 0.07;
        }

        /* CTA BUTTON */
        .cta-btn {
          width: 100%;
          padding: 0;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: block;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .cta-btn:active { transform: scale(0.97); }
        .cta-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
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
          z-index: 1;
        }
        .cta-btn-inner::before {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 17px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent);
          pointer-events: none;
        }
        .cta-btn.disabled .cta-btn-inner {
          background: rgba(255,255,255,0.04);
          color: #334155;
          cursor: not-allowed;
        }
        .cta-btn-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }
        .cta-btn.disabled .cta-btn-icon {
          background: rgba(255,255,255,0.05);
        }

        /* HISTÓRICO */
        .history-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          padding: 0 4px;
          margin-bottom: 2px;
        }
        .history-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
        }
        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          transition: background 0.15s;
          cursor: pointer;
        }
        .history-item:hover { background: rgba(255,255,255,0.03); }
        .history-item + .history-item {
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .history-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          flex-shrink: 0;
        }
        .history-placa {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: 0.04em;
        }
        .history-date {
          font-size: 10px;
          font-weight: 500;
          color: #475569;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 3px;
        }
        .history-chevron {
          color: #334155;
          flex-shrink: 0;
        }
        .history-empty {
          padding: 40px;
          text-align: center;
          color: #334155;
          font-size: 13px;
          font-style: italic;
        }

        /* DIVIDER LINE */
        .section-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 2px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
      `}</style>

      <main className="dash-root">
        <div className="dash-inner">

          {/* HEADER */}
          <div className="header-card">
            <div>
              <div className="header-greeting">Bem-vindo de volta</div>
              <div className="header-name">{userProfile?.nome || 'Técnico'}</div>
              <div className="header-username">@{userProfile?.username || 'user'}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sair">
              <LogOut size={18} />
            </button>
          </div>

          {/* VEHICLE CARD */}
          <div className="vehicle-card">
            <div className="vehicle-card-bg" />
            <div className="vehicle-card-noise" />
            <div className="vehicle-card-shine" />
            <div className="vehicle-tag">
              <div className="vehicle-tag-dot" />
              Veículo em uso
            </div>
            {veiculoAtivo ? (
              <>
                <div className="vehicle-placa">{veiculoAtivo.placa}</div>
                <div className="vehicle-modelo">{veiculoAtivo.modelo}</div>
              </>
            ) : (
              <div className="vehicle-no-car">
                <p>Nenhum veículo vinculado</p>
                <p>Fale com o supervisor da frota.</p>
              </div>
            )}
            <Car size={130} className="vehicle-icon-bg" />
          </div>

          {/* STATUS GRID */}
          <div className="status-grid">
            <div className="status-card">
              <div className="status-corner" style={{ background: '#38bdf8' }} />
              <div className="status-icon-wrap" style={{ background: 'rgba(56,189,248,0.1)' }}>
                <Camera size={18} color="#38bdf8" />
              </div>
              <div className="status-value">6 Fotos</div>
              <div className="status-label">Obrigatórias</div>
            </div>

            <div className="status-card">
              <div className="status-corner" style={{ background: veiculoAtivo ? '#34d399' : '#fbbf24' }} />
              <div className="status-icon-wrap" style={{ background: veiculoAtivo ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)' }}>
                {veiculoAtivo
                  ? <CheckCircle2 size={18} color="#34d399" />
                  : <AlertCircle size={18} color="#fbbf24" />
                }
              </div>
              <div className="status-value">{veiculoAtivo ? 'Liberado' : 'Aguardando'}</div>
              <div className="status-label">Status</div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={veiculoAtivo ? '/tecnico/nova-inspecao' : '#'}
            className={`cta-btn ${!veiculoAtivo ? 'disabled' : ''}`}
          >
            <div className="cta-btn-inner">
              <div className="cta-btn-icon">+</div>
              Nova Inspeção
            </div>
          </Link>

          {/* HISTORY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="section-divider">
              <div className="divider-line" />
              <div className="history-label">
                <FileText size={12} /> Histórico Recente
              </div>
              <div className="divider-line" />
            </div>

            <div className="history-card">
              {ultimasInspecoes.length > 0 ? (
                ultimasInspecoes.map((ins) => (
                  <div key={ins.id} className="history-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="history-icon">
                        <Car size={16} />
                      </div>
                      <div>
                        <div className="history-placa">{ins.placa}</div>
                        <div className="history-date">{formatarDataSegura(ins.inspection_date)}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="history-chevron" />
                  </div>
                ))
              ) : (
                <div className="history-empty">Nenhuma inspeção realizada ainda.</div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}