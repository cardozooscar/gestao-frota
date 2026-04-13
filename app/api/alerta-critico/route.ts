import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/evolution'; // Reutilizando sua função!

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { placa, tecnico, itensFaltantes, observacaoCritica } = body;

    // Monta a mensagem formatada para o Zap
    const textoMensagem = `🚨 *ALERTA DE SEGURANÇA - FIBRANET* 🚨\n\nO técnico *${tecnico}* relatou problemas na vistoria do veículo *${placa}* agora pouco:\n\n*Itens Faltantes / Irregulares:* ${itensFaltantes.join(', ')}\n\n*Observação:* _"${observacaoCritica || 'Nenhuma observação extra.'}"_\n\nAcesse o sistema para verificar.`;

    // Dispara a mensagem usando o seu arquivo evolution.ts
    const sucesso = await sendWhatsAppMessage(textoMensagem);

    if (!sucesso) {
      throw new Error('Falha ao enviar mensagem pelo arquivo lib/evolution');
    }

    return NextResponse.json({ success: true, message: 'Alerta crítico enviado!' });
  } catch (error: any) {
    console.error("Erro na API de Alerta Crítico:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}