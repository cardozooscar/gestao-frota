'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search, Plus, Wrench, Calendar, MapPin, Activity, 
  DollarSign, FileText, X, Car, FileUp, Image as ImageIcon, Download, Trash2 
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function RevisoesPage() {
  const [revisoes, setRevisoes] = useState<any[]>([])
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [filePDF, setFilePDF] = useState<File | null>(null)
  const [filePhoto, setFilePhoto] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_date: new Date().toLocaleDateString('en-CA'),
    workshop_name: '',
    service_description: '',
    odometer: '',
    cost: '',
    notes: ''
  })

  async function fetchDados() {
    try {
      setLoading(true)
      const { data: vData } = await supabase.from('vehicles').select('id, placa, modelo').order('placa', { ascending: true })
      setVeiculos(vData || [])

      const { data: rData, error } = await supabase
        .from('maintenance_records')
        .select('*, vehicles (placa, modelo)')
        .order('maintenance_date', { ascending: false })

      if (error) throw error
      setRevisoes(rData || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDados() }, [])

  // Função para EXCLUIR revisão
  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta revisão? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase.from('maintenance_records').delete().eq('id', id)
        if (error) throw error
        
        // Remove da tela sem precisar recarregar a página toda
        setRevisoes(revisoes.filter(r => r.id !== id))
      } catch (error) {
        console.error('Erro ao excluir:', error)
        alert('Erro ao excluir a revisão.')
      }
    }
  }

  // Função para gerar o PDF de uma revisão específica
  const gerarPDFRelatorio = (revisao: any) => {
    const doc = new jsPDF()
    const dataFormatada = new Date(revisao.maintenance_date).toLocaleDateString('pt-BR')

    // Cabeçalho do PDF
    doc.setFontSize(20)
    doc.text('Relatório de Revisão Mecânica', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Fibranet Brasil - Gestão de Frota`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35)

    // Tabela de Dados
    autoTable(doc, {
      startY: 45,
      head: [['Campo', 'Informação']],
      body: [
        ['Veículo', `${revisao.vehicles?.placa} - ${revisao.vehicles?.modelo}`],
        ['Data do Serviço', dataFormatada],
        ['Oficina', revisao.workshop_name],
        ['Serviço Realizado', revisao.service_description],
        ['Odômetro', `${revisao.odometer.toLocaleString('pt-BR')} KM`],
        ['Custo Total', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revisao.cost)],
        ['Observações', revisao.notes || 'Nenhuma observação informada.'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [47, 110, 234] }
    })

    doc.save(`revisao_${revisao.vehicles?.placa}_${revisao.maintenance_date}.pdf`)
  }

  async function uploadFile(file: File, path: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${path}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('maintenance-files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('maintenance-files').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      let pdf_url = null
      let photo_url = null

      if (filePDF) pdf_url = await uploadFile(filePDF, 'pdfs')
      if (filePhoto) photo_url = await uploadFile(filePhoto, 'photos')

      const { error } = await supabase
        .from('maintenance_records')
        .insert([{
          ...formData,
          odometer: parseInt(formData.odometer),
          cost: parseFloat(formData.cost.replace(',', '.')),
          pdf_url,
          photo_url
        }])

      if (error) throw error

      setFormData({ vehicle_id: '', maintenance_date: new Date().toLocaleDateString('en-CA'), workshop_name: '', service_description: '', odometer: '', cost: '', notes: '' })
      setFilePDF(null); setFilePhoto(null)
      setIsModalOpen(false)
      fetchDados()
    } catch (error: any) {
      console.error('Erro ao salvar revisão:', error)
      alert(`Erro ao salvar: ${error?.message || 'Verifique se todos os campos estão corretos.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const revisoesFiltradas = revisoes.filter(r => {
    const termo = busca.toLowerCase()
    return r.vehicles?.placa?.toLowerCase().includes(termo) || r.workshop_name.toLowerCase().includes(termo) || r.service_description.toLowerCase().includes(termo)
  })

  return (
    <div className="flex-1 p-8 bg-[#0a0f2c] min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Wrench className="text-blue-500" /> Histórico de Revisões</h1>
          <p className="text-slate-400">Controle total de arquivos e manutenções.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={20} /> Nova Revisão</button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
        <div className="mb-8 border-b border-white/10 pb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-10 outline-none focus:border-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div></div>
        ) : (
          <div className="space-y-4">
            {revisoesFiltradas.map((r) => (
              <div key={r.id} className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-blue-500/30 transition-all">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white uppercase">{r.vehicles?.placa} - {r.service_description}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1"><MapPin size={14} /> {r.workshop_name} | {new Date(r.maintenance_date).toLocaleDateString('pt-BR')}</p>
                  
                  {/* Atalhos para arquivos salvos */}
                  <div className="flex gap-4 mt-3">
                    {r.pdf_url && <a href={r.pdf_url} target="_blank" className="text-[10px] font-bold text-red-400 hover:underline flex items-center gap-1">PDF ANEXADO</a>}
                    {r.photo_url && <a href={r.photo_url} target="_blank" className="text-[10px] font-bold text-blue-400 hover:underline flex items-center gap-1">FOTO ANEXADA</a>}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-emerald-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.cost)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{r.odometer} KM</p>
                  </div>
                  
                  {/* BOTÕES DE AÇÃO: DOWNLOAD E EXCLUIR */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => gerarPDFRelatorio(r)}
                      className="p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-blue-400 transition-all"
                      title="Baixar Relatório PDF"
                    >
                      <Download size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all"
                      title="Excluir Registro"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f153a] border border-white/10 rounded-3xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="text-blue-500" /> Cadastrar Revisão</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <select required value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none">
                  <option value="">Veículo...</option>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                </select>
                <input type="date" required value={formData.maintenance_date} onChange={e => setFormData({...formData, maintenance_date: e.target.value})} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Oficina" required value={formData.workshop_name} onChange={e => setFormData({...formData, workshop_name: e.target.value})} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" />
                <input type="number" placeholder="KM" required value={formData.odometer} onChange={e => setFormData({...formData, odometer: e.target.value})} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input type="text" placeholder="Serviço" className="col-span-2 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" required value={formData.service_description} onChange={e => setFormData({...formData, service_description: e.target.value})} />
                <input type="number" step="0.01" placeholder="Custo (R$)" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><FileUp size={12}/> Anexar Nota Fiscal (PDF)</label>
                  <input type="file" accept=".pdf" onChange={e => setFilePDF(e.target.files?.[0] || null)} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><ImageIcon size={12}/> Anexar Foto do Serviço</label>
                  <input type="file" accept="image/*" onChange={e => setFilePhoto(e.target.files?.[0] || null)} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer" />
                </div>
              </div>

              <textarea placeholder="Observações (Se for garantia, avise aqui e coloque o custo como 0)..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm min-h-[100px]" />

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold px-4">Cancelar</button>
                <button type="submit" disabled={submitting} className="bg-blue-600 px-8 py-3 rounded-xl font-bold text-white shadow-lg">{submitting ? 'Salvando...' : 'Salvar Revisão'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}