// app/api/cron/inspecoes-atrasadas/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/evolution';

export async function GET(request: Request) {
  // 🔐 TRAVA DE SEGURANÇA: 
  // Garante que apenas a Vercel (ou quem tiver a chave) possa rodar este script.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Não autorizado', { status: 401 });
  }

  try {
    // 1. Busca os vínculos ativos (quem está com carro agora)
    const { data: vinculos, error: vError } = await supabase
      .from('vehicle_assignments')
      .select('vehicle_id, profile_id')
      .is('ended_at', null);

    if (vError) throw vError;

    if (!vinculos || vinculos.length === 0) {
      return NextResponse.json({ message: "Nenhum vínculo ativo encontrado no momento." });
    }

    const alertas: string[] = [];
    const hoje = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);

    // 2. Processa cada vínculo individualmente
    for (const item of vinculos) {
      // Busca dados do veículo (placa e modelo)
      const { data: carro } = await supabase
        .from('vehicles')
        .select('placa, modelo')
        .eq('id', item.vehicle_id)
        .single();

      // Busca dados do técnico (nome)
      const { data: tecnico } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', item.profile_id)
        .single();

      // Busca a última data de inspeção desse veículo específico
      const { data: ultima } = await supabase
        .from('inspections')
        .select('inspection_date')
        .eq('vehicle_id', item.vehicle_id)
        .order('inspection_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let isAtrasado = false;
      let statusTexto = "";

      if (!ultima) {
        // Se nunca houve inspeção na história do carro
        isAtrasado = true;
        statusTexto = "⚠️ *Nenhuma inspeção realizada até hoje*";
      } else {
        const dataInspecao = new Date(ultima.inspection_date);
        
        // Se a inspeção foi feita há mais de 7 dias
        if (dataInspecao < seteDiasAtras) {
          isAtrasado = true;
          const diffTime = Math.abs(hoje.getTime() - dataInspecao.getTime());
          const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          statusTexto = `⏳ Atrasada há *${dias} dias* (Última: ${dataInspecao.toLocaleDateString('pt-BR')})`;
        }
      }

      // Se estiver atrasado e tivermos os dados, adicionamos à lista do Zap
      if (isAtrasado && carro && tecnico) {
        alertas.push(`🚗 *${carro.placa}* (${carro.modelo || 'S/M'})\n👤 Técnico: ${tecnico.nome}\n${statusTexto}`);
      }
    }

    // 3. Envio consolidado para o WhatsApp
    if (alertas.length > 0) {
      const mensagem = `📢 *CONTROLE DE FROTA FIBRANET*\n\nIdentificamos veículos em uso com a inspeção semanal pendente:\n\n${alertas.join('\n\n──────────────\n\n')}\n\n👉 *Ação:* Técnicos, por favor, realizem a vistoria via aplicativo o quanto antes.`;
      
      const sucesso = await sendWhatsAppMessage(mensagem);
      
      return NextResponse.json({ 
        status: sucesso ? "Sucesso" : "Erro Evolution API", 
        pendentes: alertas.length 
      });
    }

    // Caso todos os técnicos estejam com as inspeções em dia
    return NextResponse.json({ message: "Tudo em dia! Nenhuma inspeção atrasada encontrada." });

  } catch (error: any) {
    console.error("Erro na execução do Cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}