import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#02052b] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#070b3f] border border-[#1d2466] rounded-2xl p-8 shadow-2xl text-center">
        <div className="text-4xl font-bold tracking-tight text-white">Fibranet</div>
        <p className="text-yellow-400 font-semibold mt-6 text-2xl">Sistema de Gestão de Frota</p>
        <p className="text-slate-300 mt-3">
          Controle de inspeções, fotos e histórico dos veículos.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-lg bg-[#2f6eea] hover:bg-[#255ed0] transition px-4 py-3 font-bold"
          >
            ACESSAR PAINEL
          </Link>

          <Link
            href="/cadastro"
            className="block w-full rounded-lg bg-[#1d2466] hover:bg-[#28318a] transition px-4 py-3 font-semibold"
          >
            CRIAR NOVO LOGIN
          </Link>
        </div>
      </div>
    </main>
  )
}