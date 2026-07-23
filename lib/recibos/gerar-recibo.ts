import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { gerarPdfSimples, pdfParaBase64 } from "@/lib/pdf/gerador-pdf";
import { formatarData, formatarMoeda } from "@/lib/formatadores";
import { enviarWhatsApp } from "@/lib/notificacoes/whatsapp";
import { enviarEmail } from "@/lib/notificacoes/email";

type ResultadoGeracaoRecibo = {
  sucesso: boolean;
  erro?: string;
  reciboId?: string;
  numeroRecibo?: string;
};

function gerarNumeroRecibo(): string {
  const agora = new Date();
  const carimbo = agora.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const aleatorio = Math.floor(Math.random() * 900 + 100);
  return `REC-${carimbo}-${aleatorio}`;
}

// Gera o PDF do recibo, salva no Supabase Storage (bucket "recibos") quando
// disponível — caso contrário guarda o PDF como data URI base64 na própria
// coluna `pdf_url` — e dispara as notificações para inquilino e proprietário.
export async function gerarReciboParaPagamento(
  pagamentoId: string
): Promise<ResultadoGeracaoRecibo> {
  const supabase = criarClienteSupabaseServidor();

  const { data: pagamento, error: erroPagamento } = await supabase
    .from("pagamentos")
    .select(
      "id, valor_pago, data_pagamento, cobrancas(id, competencia, data_vencimento, imoveis_alugados(endereco_completo, valor_aluguel, proprietarios(nome, email, telefone), inquilinos(nome, email, telefone)))"
    )
    .eq("id", pagamentoId)
    .single();

  if (erroPagamento || !pagamento) {
    return { sucesso: false, erro: "Pagamento não encontrado." };
  }

  // O select acima retorna tipos aninhados dinâmicos vindos do Supabase.
  const cobranca = (pagamento as any).cobrancas;
  const locacao = cobranca?.imoveis_alugados;
  const proprietario = locacao?.proprietarios;
  const inquilino = locacao?.inquilinos;

  const numeroRecibo = gerarNumeroRecibo();

  const pdfBytes = gerarPdfSimples(`Recibo ${numeroRecibo}`, [
    { texto: "GM Negócios Imobiliários", tamanho: 16, negrito: true },
    { texto: "Recibo de aluguel", tamanho: 13, negrito: true, espacoAntes: 4 },
    { texto: `Recibo nº: ${numeroRecibo}`, espacoAntes: 12 },
    { texto: `Imóvel: ${locacao?.endereco_completo ?? "-"}` },
    { texto: `Proprietário: ${proprietario?.nome ?? "-"}` },
    { texto: `Inquilino: ${inquilino?.nome ?? "-"}` },
    { texto: `Competência: ${cobranca?.competencia ?? "-"}`, espacoAntes: 8 },
    { texto: `Vencimento: ${formatarData(cobranca?.data_vencimento)}` },
    { texto: `Data do pagamento: ${formatarData((pagamento as any).data_pagamento)}` },
    {
      texto: `Valor pago: ${formatarMoeda((pagamento as any).valor_pago)}`,
      negrito: true,
      espacoAntes: 4,
    },
    {
      texto: "Declaro, para os devidos fins, que recebi o valor acima referente ao",
      espacoAntes: 30,
    },
    { texto: "aluguel do imóvel identificado neste recibo." },
    { texto: "____________________________________", espacoAntes: 60 },
    { texto: "Assinatura — GM Negócios Imobiliários" },
  ]);

  const base64 = pdfParaBase64(pdfBytes);
  let pdfUrl = `data:application/pdf;base64,${base64}`;

  const caminhoStorage = `recibos/${numeroRecibo}.pdf`;
  const { error: erroUpload } = await supabase.storage
    .from("recibos")
    .upload(caminhoStorage, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (!erroUpload) {
    const { data: urlPublica } = supabase.storage
      .from("recibos")
      .getPublicUrl(caminhoStorage);
    if (urlPublica?.publicUrl) {
      pdfUrl = urlPublica.publicUrl;
    }
  }
  // Se o bucket "recibos" não existir ainda no Supabase Storage, seguimos
  // com o PDF em base64 direto na coluna — funciona, só é mais pesado.

  const { data: recibo, error: erroRecibo } = await supabase
    .from("recibos")
    .insert({
      pagamento_id: pagamentoId,
      numero_recibo: numeroRecibo,
      pdf_url: pdfUrl,
    })
    .select()
    .single();

  if (erroRecibo || !recibo) {
    return { sucesso: false, erro: `Erro ao salvar recibo: ${erroRecibo?.message ?? ""}` };
  }

  const mensagem =
    `Olá! Segue o recibo de aluguel referente ao imóvel ${locacao?.endereco_completo ?? ""}, ` +
    `competência ${cobranca?.competencia ?? ""}, valor ${formatarMoeda((pagamento as any).valor_pago)}. ` +
    `Recibo: ${pdfUrl}`;

  if (inquilino?.telefone) {
    await enviarWhatsApp(inquilino.telefone, mensagem);
  }
  if (proprietario?.telefone) {
    await enviarWhatsApp(proprietario.telefone, mensagem);
  }
  if (inquilino?.email) {
    await enviarEmail(inquilino.email, `Recibo de aluguel ${numeroRecibo}`, `<p>${mensagem}</p>`);
  }
  if (proprietario?.email) {
    await enviarEmail(proprietario.email, `Recibo de aluguel ${numeroRecibo}`, `<p>${mensagem}</p>`);
  }

  await supabase
    .from("recibos")
    .update({
      enviado_inquilino_em: new Date().toISOString(),
      enviado_proprietario_em: new Date().toISOString(),
      ultimo_meio_envio: "whatsapp",
    })
    .eq("id", (recibo as { id: string }).id);

  return { sucesso: true, reciboId: (recibo as { id: string }).id, numeroRecibo };
}
