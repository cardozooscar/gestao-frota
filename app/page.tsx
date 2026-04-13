'use client'

import Link from 'next/link'
import { Car, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f2c] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* EFEITOS DE LUZ NO FUNDO (BLUR) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* CONTAINER PRINCIPAL */}
      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        
        {/* ÍCONE / LOGO */}
        <div className="flex justify-center mb-8">
          <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/30 relative">
            <Car size={48} className="text-white" />
            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#0a0f2c] rounded-full flex items-center justify-center border border-white/10">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* TEXTOS */}
        <div className="text-center mb-10 w-full">
          <h2 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">
            Fibranet Brasil
          </h2>
          <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tighter">
            Gestão de <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Frota
            </span>
          </h1>
          <p className="text-slate-400 text-sm font-medium px-4 leading-relaxed">
            Plataforma centralizada para controle de inspeções, fotos e histórico dos veículos.
          </p>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="space-y-4 w-full">
          <Link 
            href="/login" 
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] group"
          >
            ACESSAR PAINEL
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/cadastro" 
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 p-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
          >
            <UserPlus size={18} />
            CRIAR NOVO LOGIN
          </Link>
        </div>

        {/* RODAPÉ */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Fibranet. Todos os direitos reservados.
          </p>
        </div>

      </div>
    </main>
  )
}