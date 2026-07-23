// Helper de envio de e-mail.
//
// STUB: hoje apenas registra no console. Para ativar, integre um provedor
// (Resend, SendGrid, Postmark, SMTP) preenchendo RESEND_API_KEY (ou
// equivalente) e trocando o corpo de `enviarEmail` pela chamada HTTP real.

export type AnexoEmail = {
  nomeArquivo: string;
  conteudoBase64: string;
  tipoMime: string;
};

export type ResultadoEnvioEmail = {
  sucesso: boolean;
  erro?: string;
};

export async function enviarEmail(
  destinatario: string,
  assunto: string,
  corpoHtml: string,
  anexos: AnexoEmail[] = []
): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE ?? "financeiro@gmimoveis.com.br";

  if (!apiKey) {
    console.log(
      `[Email STUB] Para ${destinatario} | Assunto: ${assunto} | Anexos: ${anexos.length}`
    );
    return { sucesso: true };
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: remetente,
        to: [destinatario],
        subject: assunto,
        html: corpoHtml,
        attachments: anexos.map((a) => ({
          filename: a.nomeArquivo,
          content: a.conteudoBase64,
        })),
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
      erro: erro instanceof Error ? erro.message : "Erro desconhecido ao enviar e-mail.",
    };
  }
}
