import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { gerarPdfSimples, pdfParaBase64, type LinhaPdf } from "@/lib/pdf/gerador-pdf";
import { formatarMoeda, competenciaLabel } from "@/lib/formatadores";

type ResultadoDemonstrativo = { sucesso: boolean; erro?: string; url?: string };

// Gera o PDF de "prestação de contas" de um repasse já calculado/gravado e
// salva a URL em repasses.demonstrativo_url. Mesmo mecanismo de PDF/Storage
// já usado para recibos (ver lib/recibos/gerar-recibo.ts).
export async function gerarDemonstrativoRepasse(
  repasseId: string
): Promise<ResultadoDemonstrativo> {
  const supabase = criarClienteSupabaseServidor();

  const { data: repasse, error: erroRepasse } = await supabase
    .from("repasses")
    .select("id, competencia, valor_bruto, taxa_administracao, total_despesas, valor_liquido, proprietarios(nome)")
    .eq("id", repasseId)
    .single();

  if (erroRepasse || !repasse) {
    return { sucesso: false, erro: "Repasse não encontrado." };
  }

  const { data: itens } = await supabase
    .from("repasse_itens")
    .select("tipo, sinal, descricao, valor")
    .eq("repasse_id", repasseId)
    .order("tipo", { ascending: true });

  const proprietario = (repasse as any).proprietarios;
  const competencia = (repasse as any).competencia as string;

  const linhas: LinhaPdf[] = [
    { texto: "GM Negócios Imobiliários", tamanho: 16, negrito: true },
    { texto: "Demonstrativo de repasse", tamanho: 13, negrito: true, espacoAntes: 4 },
    { texto: `Proprietário: ${proprietario?.nome ?? "-"}`, espacoAntes: 12 },
    { texto: `Competência: ${competenciaLabel(competencia)}` },
    { texto: "Itens", tamanho: 12, negrito: true, espacoAntes: 20 },
  ];

  for (const item of (itens ?? []) as any[]) {
    const prefixo = item.sinal === "credito" ? "+ " : "- ";
    linhas.push({
      texto: `${prefixo}${item.descricao}: ${formatarMoeda(item.valor)}`,
      espacoAntes: 2,
    });
  }

  linhas.push(
    { texto: `Valor bruto: ${formatarMoeda((repasse as any).valor_bruto)}`, espacoAntes: 16 },
    { texto: `Taxa de administração: ${formatarMoeda((repasse as any).taxa_administracao)}` },
    { texto: `Despesas descontadas: ${formatarMoeda((repasse as any).total_despesas)}` },
    {
      texto: `Valor líquido a repassar: ${formatarMoeda((repasse as any).valor_liquido)}`,
      tamanho: 13,
      negrito: true,
      espacoAntes: 6,
    }
  );

  const pdfBytes = gerarPdfSimples(`Demonstrativo ${competencia}`, linhas);
  const base64 = pdfParaBase64(pdfBytes);
  let demonstrativoUrl = `data:application/pdf;base64,${base64}`;

  const caminhoStorage = `demonstrativos/${repasseId}.pdf`;
  const { error: erroUpload } = await supabase.storage
    .from("demonstrativos")
    .upload(caminhoStorage, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (!erroUpload) {
    const { data: urlPublica } = supabase.storage
      .from("demonstrativos")
      .getPublicUrl(caminhoStorage);
    if (urlPublica?.publicUrl) {
      demonstrativoUrl = urlPublica.publicUrl;
    }
  }
  // Se o bucket "demonstrativos" não existir ainda, segue com o PDF em
  // base64 direto na coluna — mesmo comportamento de fallback dos recibos.

  await supabase
    .from("repasses")
    .update({ demonstrativo_url: demonstrativoUrl })
    .eq("id", repasseId);

  return { sucesso: true, url: demonstrativoUrl };
}
