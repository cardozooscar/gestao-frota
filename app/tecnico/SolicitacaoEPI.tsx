'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, Camera, Check, PenTool } from 'lucide-react'
// IMPORT CORRIGIDO: Usando a sua conexão oficial
import { supabase } from '@/lib/supabase' 

const LISTA_ITENS = ['Camisa', 'Calça', 'Bota', 'Chapéu', 'Capacete', 'Óculos', 'Luva']

type ItemState = { selecionado: boolean; quantidade: string; tamanho: string }
type FormData = Record<string, ItemState>

export default function SolicitacaoEPI({ technicianId }: { technicianId: string }) {
  
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  const [formData, setFormData] = useState<FormData>(
    LISTA_ITENS.reduce((acc, item) => ({ ...acc, [item]: { selecionado: false, quantidade: '1', tamanho: '' } }), {})
  )
  
  const [fotoBlob, setFotoBlob] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  let isDrawing = false

  useEffect(() => {
    async function checkLock() {
      // Busca no banco se está liberado
      const { data, error } = await supabase
        .from('profiles')
        .select('epi_unlocked')
        .eq('id', technicianId)
        .single()
        
      if (data) {
        setIsUnlocked(data.epi_unlocked)
      } else if (error) {
        console.error('Erro ao ler trava:', error)
      }
      setLoading(false)
    }
    checkLock()
  }, [technicianId])

  const startDrawing = (e: any) => {
    isDrawing = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX || e.touches[0].clientX - e.target.getBoundingClientRect().left, 
               e.nativeEvent.offsetY || e.touches[0].clientY - e.target.getBoundingClientRect().top)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    e.preventDefault() 
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.lineTo(e.nativeEvent.offsetX || e.touches[0].clientX - e.target.getBoundingClientRect().left, 
               e.nativeEvent.offsetY || e.touches[0].clientY - e.target.getBoundingClientRect().top)
    ctx.stroke()
  }

  const stopDrawing = () => { isDrawing = false }

  const limparAssinatura = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFotoBlob(file)
      setFotoPreview(URL.createObjectURL(file))
    }
  }

  const toggleItem = (item: string) => {
    setFormData(prev => ({
      ...prev,
      [item]: { ...prev[item], selecionado: !prev[item].selecionado }
    }))
  }

  const updateItem = (item: string, field: 'quantidade' | 'tamanho', value: string) => {
    setFormData(prev => ({
      ...prev,
      [item]: { ...prev[item], [field]: value }
    }))
  }

  const handleSubmit = async () => {
    const itensSelecionados = Object.entries(formData).filter(([_, data]) => data.selecionado)
    if (itensSelecionados.length === 0) return alert('Selecione pelo menos um item.')
    if (!fotoBlob) return alert('É obrigatório registrar uma foto do rosto.')
    
    const canvas = canvasRef.current
    const isCanvasBlank = canvas?.toDataURL() === document.createElement('canvas').toDataURL()
    if (isCanvasBlank) return alert('A assinatura é obrigatória.')

    setSalvando(true)

    try {
      const urlFotoSimulada = 'url_da_foto.jpg'
      const urlAssinaturaSimulada = 'url_da_assinatura.png'

      const itensParaSalvar = itensSelecionados.reduce((acc, [nome, dados]) => {
        return { ...acc, [nome]: { qtd: dados.quantidade, tam: dados.tamanho } }
      }, {})

      await supabase.from('epi_requests').insert([{
        technician_id: technicianId,
        items: itensParaSalvar,
        photo_url: urlFotoSimulada,
        signature_url: urlAssinaturaSimulada
      }])

      await supabase.from('profiles').update({ epi_unlocked: false }).eq('id', technicianId)
      
      alert('Solicitação enviada com sucesso!')
      setIsUnlocked(false)

    } catch (error) {
      console.error(error)
      alert('Erro ao enviar solicitação.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <div className="text-white text-center p-8 border border-white/10 rounded-2xl">Lendo permissões...</div>

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#070b3f]/60 p-12 backdrop-blur-md text-center shadow-2xl">
        <div className="rounded-full bg-slate-800/50 p-4 border border-white/5 mb-4">
          <Lock size={48} className="text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Aba Bloqueada</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          A solicitação de materiais e EPIs está temporariamente bloqueada. Solicite a liberação ao seu gestor para registrar um novo pedido.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-blue-500/30 bg-[#070b3f]/80 p-6 backdrop-blur-md shadow-2xl mt-4">
      <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6">Nova Solicitação de Material</h2>

      <div className="space-y-3 mb-8">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Selecione os itens</h3>
        {LISTA_ITENS.map((item) => (
          <div key={item} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData[item].selecionado}
                onChange={() => toggleItem(item)}
                className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
              />
              <span className="text-white font-medium">{item}</span>
            </label>

            {formData[item].selecionado && (
              <div className="flex gap-2 pl-8 sm:pl-0">
                <input 
                  type="number" 
                  min="1"
                  value={formData[item].quantidade}
                  onChange={(e) => updateItem(item, 'quantidade', e.target.value)}
                  placeholder="Qtd"
                  className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="text" 
                  value={formData[item].tamanho}
                  onChange={(e) => updateItem(item, 'tamanho', e.target.value)}
                  placeholder="Tamanho (Ex: M, 42)"
                  className="w-40 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Validação de Identidade</h3>
        <div className="flex flex-col items-center p-6 rounded-2xl border-2 border-dashed border-white/10 bg-black/20">
          {fotoPreview ? (
            <div className="relative">
              <img src={fotoPreview} alt="Selfie" className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-xl" />
              <button onClick={() => {setFotoBlob(null); setFotoPreview(null)}} className="absolute -bottom-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full w-full">Refazer</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer text-blue-400 hover:text-blue-300 transition-colors">
              <div className="p-4 bg-blue-500/10 rounded-full mb-2">
                <Camera size={32} />
              </div>
              <span className="text-sm font-medium">Tirar Foto do Rosto</span>
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleCapture} />
            </label>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Assinatura do Colaborador</h3>
          <button onClick={limparAssinatura} className="text-xs text-red-400 hover:text-red-300">Limpar Quadro</button>
        </div>
        <div className="bg-white rounded-xl overflow-hidden shadow-inner touch-none">
          <canvas
            ref={canvasRef}
            width={800} 
            height={200}
            className="w-full h-[200px] cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }} 
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={salvando}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50"
      >
        {salvando ? 'Processando...' : <><Check size={20} /> Confirmar e Assinar Recibo</>}
      </button>

    </div>
  )
}