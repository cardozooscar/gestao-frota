// app/api/test-bot/route.ts

import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/evolution'; // <-- Caminho corrigido com o @/

export async function GET() {
  const dataAtual = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  const mensagem = `🤖 *Teste de Integração - Fibranet*\n\nOlá, equipe! O bot da Gestão de Frota foi conectado com sucesso ao painel web. ✅\n\n🗓️ Data do teste: ${dataAtual}`;

  const sucesso = await sendWhatsAppMessage(mensagem);

  if (sucesso) {
    return NextResponse.json({ 
      status: "Sucesso", 
      message: 'Mensagem enviada com sucesso para o grupo GESTÃO FROTA - FIBRANET!' 
    });
  } else {
    return NextResponse.json({ 
      status: "Erro", 
      error: 'Falha ao enviar mensagem. Verifique os logs do terminal do Next.js para ver o motivo.' 
    }, { status: 500 });
  }
}