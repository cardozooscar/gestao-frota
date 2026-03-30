'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [status, setStatus] = useState('Testando conexão...')

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase.from('vehicles').select('*').limit(1)

      if (error) {
        setStatus('Erro ao conectar: ' + error.message)
      } else {
        setStatus('Conectado com sucesso 🚀')
      }
    }

    testConnection()
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1 className="text-2xl font-bold">{status}</h1>
    </main>
  )
}