// lib/evolution.ts

export async function sendWhatsAppMessage(text: string) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;
  const groupId = process.env.EVOLUTION_FROTA_GROUP_ID;

  if (!apiUrl || !apiKey || !instance || !groupId) {
    console.error('Faltam variáveis de ambiente da Evolution API no .env.local');
    return false;
  }

  // Monta a URL correta da Evolution API para envio de texto
  const endpoint = `${apiUrl}/message/sendText/${instance}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      // Formato atualizado para a Evolution API v2.x
      body: JSON.stringify({
        number: groupId,
        text: text,
        delay: 1200
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro retornado pela Evolution API:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Falha de conexão com a Evolution API:', error);
    return false;
  }
}