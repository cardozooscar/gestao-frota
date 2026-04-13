import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Ignora se não for uma mensagem nova
    if (body.event !== 'messages.upsert') return NextResponse.json({ success: true });

    const messageInfo = body.data?.message;
    if (!messageInfo) return NextResponse.json({ success: true });

    // Se a mensagem foi enviada pelo PRÓPRIO bot, ignora para não dar loop infinito
    if (body.data?.key?.fromMe) return NextResponse.json({ success: true });

    // Extrai o texto e limpa (deixa tudo maiúsculo e sem espaços sobrando)
    const rawText = messageInfo.conversation || messageInfo.extendedTextMessage?.text || '';
    const textoMensagem = rawText.trim().toUpperCase();
    const numeroRemetente = body.data?.key?.remoteJid;

    // Remove traços e espaços para testar se é uma placa pura
    const textoLimpo = textoMensagem.replace(/[^A-Z0-9]/g, '');
    // Regex inteligente: Aceita placa padrão antigo (ABC1234) ou Mercosul (ABC1D23)
    const isPlaca = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(textoLimpo);

    // ==========================================
    // COMANDO 1: /PLACAS (Lista todos os veículos)
    // ==========================================
    if (textoMensagem === '/PLACAS') {
      // Busca veículos ativos
      const { data: veiculos } = await supabaseAdmin
        .from('vehicles')
        .select('id, placa, modelo')
        .eq('ativo', true)
        .order('placa');

      // Busca quem está com os carros
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
        // Acha os técnicos (Preparado para as duplas!)
        const tecnicosDoCarro = vinculos?.filter(vin => vin.vehicle_id === v.id) || [];
        const nomes = tecnicosDoCarro.length > 0 
          ? tecnicosDoCarro.map(t => t.profiles?.nome).join(' e ') 
          : 'Livre / No Pátio';

        listaTexto += `🚗 *${v.placa}* (${v.modelo || 'S/M'})\n👤 ${nomes}\n\n`;
      });

      listaTexto += `💡 *Dica:* Digite apenas a *PLACA* de qualquer veículo acima para ver o relatório completo dele!`;

      await enviarResposta(numeroRemetente, listaTexto);
      return NextResponse.json({ success: true });
    }

    // ==========================================
    // COMANDO 2: DIGITOU UMA PLACA (Dossiê)
    // ==========================================
    if (isPlaca) {
      const placaBuscada = textoLimpo; // Ex: PZG8449

      // A. Busca o carro no banco
      const { data: veiculo } = await supabaseAdmin
        .from('vehicles')
        .select('id, placa, modelo, ativo')
        .eq('placa', placaBuscada)
        .single();

      if (!veiculo) {
        await enviarResposta(numeroRemetente, `❌ O veículo com a placa *${placaBuscada}* não foi encontrado no sistema.`);
        return NextResponse.json({ success: true });
      }

      // B. Busca quem está com o carro (Lida com as duplas)
      const { data: vinculos } = await supabaseAdmin
        .from('vehicle_assignments')
        .select('profiles(nome)')
        .eq('vehicle_id', veiculo.id)
        .is('ended_at', null);

      const nomesTecnicos = vinculos && vinculos.length > 0 
        ? vinculos.map(v => v.profiles?.nome).join(' e ') 
        : 'Nenhum técnico vinculado';

      // C. Busca a última inspeção
      const { data: inspecao } = await supabaseAdmin
        .from('inspections')
        .select('inspection_date, odometer')
        .eq('vehicle_id', veiculo.id)
        .order('inspection_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const statusCarro = veiculo.ativo ? '✅ ATIVO' : '⛔ INATIVO';
      const dataVistoria = inspecao?.inspection_date ? new Date(inspecao.inspection_date).toLocaleDateString('pt-BR') : 'Sem registro';
      const kmAtual = inspecao?.odometer ? `${inspecao.odometer.toLocaleString('pt-BR')} km` : 'Sem registro';

      const resposta = `🤖 *DOSSIÊ DO VEÍCULO* 🤖\n\n` +
        `🚗 *Placa:* ${veiculo.placa}\n` +
        `🏷️ *Modelo:* ${veiculo.modelo || 'Não informado'}\n` +
        `⚙️ *Status:* ${statusCarro}\n` +
        `👥 *Em uso por:* ${nomesTecnicos}\n` +
        `📅 *Última Vistoria:* ${dataVistoria}\n` +
        `🛣️ *KM Atual:* ${kmAtual}`;

      await enviarResposta(numeroRemetente, resposta);
      return NextResponse.json({ success: true });
    }

    // Se o usuário digitou qualquer outra coisa ("Oi", "Bom dia"), o bot apenas ignora silenciosamente.
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