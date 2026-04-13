import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.event !== 'messages.upsert') return NextResponse.json({ success: true });

    const messageInfo = body.data?.message;
    if (!messageInfo) return NextResponse.json({ success: true });

    if (body.data?.key?.fromMe) return NextResponse.json({ success: true });

    const rawText = messageInfo.conversation || messageInfo.extendedTextMessage?.text || '';
    const textoMensagem = rawText.trim().toUpperCase();
    const numeroRemetente = body.data?.key?.remoteJid;

    const textoLimpo = textoMensagem.replace(/[^A-Z0-9]/g, '');
    const isPlaca = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(textoLimpo);

    // ==========================================
    // COMANDO 1: /PLACAS (Lista todos os veículos)
    // ==========================================
    if (textoMensagem === '/PLACAS') {
      const { data: veiculos } = await supabaseAdmin
        .from('vehicles')
        .select('id, placa, modelo')
        .eq('ativo', true)
        .order('placa');

      const { data: vinculos } = await supabaseAdmin
        .from('vehicle_assignments')
        .select('vehicle_id, profiles(nome)')
        .is('ended_at', null);

      if (!veiculos || veiculos.length === 0) {
        await enviarResposta(numeroRemetente, 'Nenhum veículo ativo encontrado.');
        return NextResponse.json({ success: true });
      }

      let listaTexto = `📋 *FROTA FIBRANET - VEÍCULOS ATIVOS* 📋\n\n`;

      veiculos.forEach(v => {
        const tecnicosDoCarro = vinculos?.filter(vin => vin.vehicle_id === v.id) || [];
        const nomes = tecnicosDoCarro.length > 0 
          ? tecnicosDoCarro.map((t: any) => t.profiles?.nome).join(' e ') 
          : 'Livre / No Pátio';

        listaTexto += `🚗 *${v.placa}* (${v.modelo || 'S/M'})\n👤 ${nomes}\n\n`;
      });

      listaTexto += `💡 *Dica:* Digite apenas a *PLACA* de qualquer veículo acima para ver o relatório completo dele!`;

      await enviarResposta(numeroRemetente, listaTexto);
      return NextResponse.json({ success: true });
    }

    // ==========================================
    // COMANDO 2: DIGITOU UMA PLACA (Dossiê com Link)
    // ==========================================
    if (isPlaca) {
      const placaBuscada = textoLimpo; 

      const { data: veiculo } = await supabaseAdmin
        .from('vehicles')
        .select('id, placa, modelo, ativo')
        .eq('placa', placaBuscada)
        .single();

      if (!veiculo) {
        await enviarResposta(numeroRemetente, `❌ O veículo com a placa *${placaBuscada}* não foi encontrado no sistema.`);
        return NextResponse.json({ success: true });
      }

      const { data: vinculos } = await supabaseAdmin
        .from('vehicle_assignments')
        .select('profiles(nome)')
        .eq('vehicle_id', veiculo.id)
        .is('ended_at', null);

      const nomesTecnicos = vinculos && vinculos.length > 0 
        ? vinculos.map((v: any) => v.profiles?.nome).join(' e ') 
        : 'Nenhum técnico vinculado';

      // 🔥 ADICIONAMOS O 'id' AQUI NA BUSCA DA INSPEÇÃO
      const { data: inspecao } = await supabaseAdmin
        .from('inspections')
        .select('id, inspection_date, odometer')
        .eq('vehicle_id', veiculo.id)
        .order('inspection_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const statusCarro = veiculo.ativo ? '✅ ATIVO' : '⛔ INATIVO';
      const dataVistoria = inspecao?.inspection_date ? new Date(inspecao.inspection_date).toLocaleDateString('pt-BR') : 'Sem registro';
      const kmAtual = inspecao?.odometer ? `${inspecao.odometer.toLocaleString('pt-BR')} km` : 'Sem registro';

      // 🔥 MONTAMOS O LINK DIRETO PARA A INSPEÇÃO/VEÍCULO (Ajuste o domínio e a rota)
      const linkVistoria = inspecao?.id 
        ? `\n\n🔗 *Ver detalhes da vistoria:*\nhttps://gestaofrotafibranet.vercel.app/gestor/veiculos/${veiculo.id}` 
        : '';

      const resposta = `🤖 *DOSSIÊ DO VEÍCULO* 🤖\n\n` +
        `🚗 *Placa:* ${veiculo.placa}\n` +
        `🏷️ *Modelo:* ${veiculo.modelo || 'Não informado'}\n` +
        `⚙️ *Status:* ${statusCarro}\n` +
        `👥 *Em uso por:* ${nomesTecnicos}\n` +
        `📅 *Última Vistoria:* ${dataVistoria}\n` +
        `🛣️ *KM Atual:* ${kmAtual}` +
        linkVistoria; // Acoplamos o link no final da mensagem

      await enviarResposta(numeroRemetente, resposta);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro no Webhook Evolution:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Função de disparo para o Evolution API
async function enviarResposta(numeroJid: string, texto: string) {
  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/zabbix-alert`; // ⚠️ COLOQUE O NOME DA SUA INSTÂNCIA AQUI
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!url || !apiKey) return;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
    body: JSON.stringify({
      number: numeroJid,
      text: texto
    })
  });
}