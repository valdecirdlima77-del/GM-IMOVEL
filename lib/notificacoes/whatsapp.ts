// Helper de notificação via WhatsApp.
//
// STUB: hoje apenas registra a mensagem no console e retorna sucesso.
// Para ativar de verdade, plugue a WhatsApp Cloud API (Meta) ou um provedor
// como Twilio/Z-API, preenchendo as variáveis de ambiente abaixo e trocando
// o corpo da função `enviarWhatsApp` pela chamada HTTP real.
//
// Variáveis de ambiente esperadas quando a integração for ligada:
//   WHATSAPP_API_URL, WHATSAPP_API_TOKEN, WHATSAPP_NUMERO_ORIGEM

export const NUMERO_ADMIN_GM = "5567998500610"; // 67 99850-0610, formato E.164 sem "+"

export type ResultadoEnvioWhatsApp = {
  sucesso: boolean;
  erro?: string;
};

export async function enviarWhatsApp(
  numeroDestino: string,
  mensagem: string
): Promise<ResultadoEnvioWhatsApp> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (!apiUrl || !apiToken) {
    // Integração ainda não configurada — loga para não quebrar o fluxo.
    console.log(`[WhatsApp STUB] Para ${numeroDestino}: ${mensagem}`);
    return { sucesso: true };
  }

  try {
    const resposta = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        to: numeroDestino,
        type: "text",
        text: { body: mensagem },
      }),
    });

    if (!resposta.ok) {
      const texto = await resposta.text();
      return { sucesso: false, erro: `Falha no envio (${resposta.status}): ${texto}` };
    }

    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido ao enviar WhatsApp.",
    };
  }
}

export async function alertarAdminGM(mensagem: string): Promise<ResultadoEnvioWhatsApp> {
  return enviarWhatsApp(NUMERO_ADMIN_GM, mensagem);
}
