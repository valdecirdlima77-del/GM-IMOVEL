import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { gerarPdfSimples, pdfParaBase64 } from "@/lib/pdf/gerador-pdf";
import { formatarData, formatarMoeda } from "@/lib/formatadores";

// POST /api/contratos/generate { contrato_id }
// Gera um PDF simples do contrato de locação a partir dos dados já
// cadastrados em contratos_aluguel + imoveis_alugados. Serve como rascunho
// para revisão jurídica antes da assinatura — não substitui um contrato
// revisado por advogado.
export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();
  const { contrato_id: contratoId } = (await request.json()) as {
    contrato_id: string;
  };

  if (!contratoId) {
    return NextResponse.json({ erro: "contrato_id é obrigatório." }, { status: 400 });
  }

  const { data: contrato, error } = await supabase
    .from("contratos_aluguel")
    .select(
      "*, imoveis_alugados(endereco_completo, proprietarios(nome, cpf_cnpj), inquilinos(nome, cpf))"
    )
    .eq("id", contratoId)
    .single();

  if (error || !contrato) {
    return NextResponse.json({ erro: "Contrato não encontrado." }, { status: 404 });
  }

  const locacao = (contrato as any).imoveis_alugados;
  const proprietario = locacao?.proprietarios;
  const inquilino = locacao?.inquilinos;

  const pdfBytes = gerarPdfSimples(`Contrato ${(contrato as any).numero_contrato ?? contratoId}`, [
    { texto: "GM Negócios Imobiliários", tamanho: 16, negrito: true },
    { texto: "Contrato de Locação Residencial", tamanho: 13, negrito: true, espacoAntes: 4 },
    { texto: `Contrato nº: ${(contrato as any).numero_contrato ?? "-"}`, espacoAntes: 12 },
    { texto: `Imóvel: ${locacao?.endereco_completo ?? "-"}` },
    { texto: `Locador (proprietário): ${proprietario?.nome ?? "-"} — CPF/CNPJ: ${proprietario?.cpf_cnpj ?? "-"}`, espacoAntes: 8 },
    { texto: `Locatário (inquilino): ${inquilino?.nome ?? "-"} — CPF: ${inquilino?.cpf ?? "-"}` },
    { texto: `Vigência: ${formatarData((contrato as any).data_inicio)} a ${formatarData((contrato as any).data_fim)}`, espacoAntes: 8 },
    { texto: `Valor do aluguel: ${formatarMoeda((contrato as any).valor_aluguel)}` },
    { texto: `Dia de vencimento: ${(contrato as any).dia_vencimento}` },
    { texto: `Índice de reajuste: ${(contrato as any).indice_reajuste ?? "IGPM"}` },
    { texto: `Multa por atraso: ${(contrato as any).multa_atraso_percentual ?? 2}% + juros de mora ${(contrato as any).juros_mora_percentual_dia ?? 0.0333}% ao dia` },
    { texto: (contrato as any).clausulas_extra ?? "", espacoAntes: 12 },
    { texto: "____________________________________", espacoAntes: 50 },
    { texto: "Locador" },
    { texto: "____________________________________", espacoAntes: 30 },
    { texto: "Locatário" },
  ]);

  const base64 = pdfParaBase64(pdfBytes);
  const dataUri = `data:application/pdf;base64,${base64}`;

  await supabase
    .from("contratos_aluguel")
    .update({ documento_url: dataUri })
    .eq("id", contratoId);

  return NextResponse.json({ documento_url: dataUri }, { status: 201 });
}
