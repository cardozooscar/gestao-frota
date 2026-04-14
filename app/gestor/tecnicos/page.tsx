'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Users, UserPlus, Settings2, Mail, Calendar, ShieldCheck, AtSign } from 'lucide-react'
// Importando o módulo de gestão do EPI
import GestaoEPIModulo from './GestaoEPIModulo'

type Technician = {
  id: string
  nome: string
  username: string
  email?: string
  role: string
  approved: boolean
  active: boolean
  created_at: string
}

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Estados do Formulário
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [senhaInicial, setSenhaInicial] = useState('')

  async function fetchTecnicos() {
    setLoading(true)
    // Busca os perfis que são técnicos ou supervisores
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['tecnico', 'supervisor'])
      .order('created_at', { ascending: false })

    if (data) {
      setTecnicos(data as Technician[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTecnicos()
  }, [])

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      // Aqui você faz a chamada para a sua API Route que cria o usuário no Auth Admin
      const response = await fetch('/api/gestor/tecnicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeCompleto, senha: senhaInicial }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Erro ao cadastrar técnico')

      setSucesso('Técnico cadastrado com sucesso!')
      setNomeCompleto('')
      setSenhaInicial('')
      fetchTecnicos()
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar técnico')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#02052b] p-4 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              <Users size={14} /> Equipe
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Técnicos</h1>
            <p className="mt-2 text-sm text-slate-400">Cadastre e acompanhe os usuários técnicos da operação.</p>
          </div>
        </div>

        {/* FORMULÁRIO DE NOVO TÉCNICO */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <UserPlus size={20} className="text-blue-400" /> Novo técnico
            </h2>
            <p className="text-xs text-slate-400 mt-1">O sistema gera o usuário automaticamente e usa e-mail interno invisível.</p>
          </div>

          <form onSubmit={handleCadastrar} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="text" 
              placeholder="Nome completo" 
              value={nomeCompleto} 
              onChange={(e) => setNomeCompleto(e.target.value)} 
              required
              className="rounded-xl border border-white/10 bg-[#070b3f] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#2f6eea]"
            />
            <input
              type="text" 
              placeholder="Senha inicial" 
              value={senhaInicial} 
              onChange={(e) => setSenhaInicial(e.target.value)} 
              required
              className="rounded-xl border border-white/10 bg-[#070b3f] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#2f6eea]"
            />
            
            <button
              type="submit" 
              disabled={salvando}
              className="rounded-xl bg-[#2f6eea] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#255ed0] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? 'CADASTRANDO...' : 'CADASTRAR TÉCNICO'}
            </button>
          </form>

          {erro && <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{erro}</div>}
          {sucesso && <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">{sucesso}</div>}
        </div>

        {/* LISTAGEM DE TÉCNICOS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Settings2 size={20} className="text-blue-400" /> Técnicos cadastrados
              </h2>
              <p className="text-xs text-slate-400 mt-1">Visualize os usuários técnicos já criados no sistema.</p>
            </div>

            <div className="flex items-center">
              <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-400">
                {tecnicos.length} técnico(s)
              </div>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center text-sm text-slate-400">Carregando equipe...</div>
            ) : tecnicos.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-12 flex flex-col items-center justify-center gap-3">
                <Users size={32} className="text-slate-500" />
                <p className="text-sm text-slate-400">Nenhum técnico cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {tecnicos.map((tecnico) => (
                  <div
                    key={tecnico.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-[#2f6eea] hover:shadow-2xl hover:shadow-blue-500/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                      {/* Nome e Role */}
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-white">{tecnico.nome}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tecnico.role === 'supervisor' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                            {tecnico.role}
                          </span>
                          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tecnico.approved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                            {tecnico.approved ? 'Aprovado' : 'Pendente'}
                          </span>
                          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tecnico.active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {tecnico.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes do Usuário */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                          <AtSign size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuário</p>
                          <p className="font-medium text-slate-300">{tecnico.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                          <Mail size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail Interno</p>
                          <p className="font-medium text-slate-300">{tecnico.email || `${tecnico.username}@fibranetbrasil.com.br`}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#070b3f] border border-white/5 text-slate-400">
                          <Calendar size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criado em</p>
                          <p className="font-medium text-slate-300">
                            {new Date(tecnico.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PLUGANDO O MÓDULO DO GESTOR AQUI (Controle de EPI individual) */}
                    <div className="mt-4 pt-6 border-t border-white/10">
                      <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-400"/>
                        Controle de Fardamento e EPI
                      </h4>
                      <GestaoEPIModulo technicianId={tecnico.id} />
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}