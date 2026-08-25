import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";

export type ItemRepasseCalculado = {
  tipo: "aluguel" | "despesa" | "taxa_administracao";
  sinal: "credito" | "debito";
  descricao: string;
  valor: number;
  origem_id: string | null;
};

export type RepasseCalculado = {
  proprietario_id: string;
  competencia: string; // YYYY-MM-01
  valor_bruto: number;
  taxa_administracao: number;
  total_despesas: number;
  valor_liquido: number;
  itens: ItemRepasseCalculado[];
};

// Calcula o repasse de um proprietário para uma competência, SEM gravar nada.
//
// Regra: soma os pagamentos confirmados no mês dos imóveis desse
// proprietário (valor_bruto) · aplica a comissao_percentual cadastrada nele
// (taxa_administracao) · subtrai as despesas repassáveis lançadas na mesma
// competência (total_despesas). O que sobra é o valor_liquido a depositar.
export async function calcularRepasse(
  proprietarioId: string,
  competencia: string
): Promise<RepasseCalculado | { erro: string }> {
  const supabase = criarClienteSupabaseAdmin();

  const { data: proprietario, error: erroProprietario } = await supabase
    .from("proprietarios")
    .select("id, nome, comissao_percentual")
    .eq("id", proprietarioId)
    .single();

  if (erroProprietario || !proprietario) {
    return { erro: "Proprietário não encontrado." };
  }

  const { data: imoveis } = await supabase
    .from("imoveis_alugados")
    .select("id, endereco_completo")
    .eq("proprietario_id", proprietarioId);

  const imovelIds = (imoveis ?? []).map((i) => i.id as string);
  if (imovelIds.length === 0) {
    return {
      proprietario_id: proprietarioId,
      competencia,
      valor_bruto: 0,
      taxa_administracao: 0,
      total_despesas: 0,
      valor_liquido: 0,
      itens: [],
    };
  }

  const { data: cobrancas } = await supabase
    .from("cobrancas")
    .select(
      "id, competencia, imovel_alugado_id, imoveis_alugados(endereco_completo), pagamentos(id, valor_pago, status)"
    )
    .in("imovel_alugado_id", imovelIds)
    .eq("competencia", competencia)
    .eq("status", "pago");

  const itens: ItemRepasseCalculado[] = [];
  let valorBruto = 0;

  for (const cobranca of (cobrancas ?? []) as any[]) {
    const pagamentosConfirmados = (cobranca.pagamentos ?? []).filter(
      (p: any) => p.status === "confirmado"
    );
    for (const pagamento of pagamentosConfirmados) {
      valorBruto += Number(pagamento.valor_pago);
      itens.push({
        tipo: "aluguel",
        sinal: "credito",
        descricao: `Aluguel recebido — ${cobranca.imoveis_alugados?.endereco_completo ?? "imóvel"}`,
        valor: Number(pagamento.valor_pago),
        origem_id: pagamento.id,
      });
    }
  }

  const comissaoPercentual = Number(proprietario.comissao_percentual ?? 0);
  const taxaAdministracao = Math.round(valorBruto * (comissaoPercentual / 100) * 100) / 100;
  if (taxaAdministracao > 0) {
    itens.push({
      tipo: "taxa_administracao",
      sinal: "debito",
      descricao: `Taxa de administração (${comissaoPercentual}%)`,
      valor: taxaAdministracao,
      origem_id: null,
    });
  }

  const { data: despesas } = await supabase
    .from("despesas")
    .select("id, descricao, valor, imoveis_alugados(endereco_completo)")
    .in("imovel_alugado_id", imovelIds)
    .eq("competencia", competencia)
    .eq("repassavel", true)
    .eq("pago_por", "proprietario");

  let totalDespesas = 0;
  for (const despesa of (despesas ?? []) as any[]) {
    totalDespesas += Number(despesa.valor);
    itens.push({
      tipo: "despesa",
      sinal: "debito",
      descricao: `${despesa.descricao} — ${despesa.imoveis_alugados?.endereco_completo ?? "imóvel"}`,
      valor: Number(despesa.valor),
      origem_id: despesa.id,
    });
  }

  const valorLiquido = Math.round((valorBruto - taxaAdministracao - totalDespesas) * 100) / 100;

  return {
    proprietario_id: proprietarioId,
    competencia,
    valor_bruto: Math.round(valorBruto * 100) / 100,
    taxa_administracao: taxaAdministracao,
    total_despesas: Math.round(totalDespesas * 100) / 100,
    valor_liquido: valorLiquido,
    itens,
  };
}

// Calcula e grava o repasse + itens (upsert por proprietario_id+competencia).
export async function gerarRepasse(proprietarioId: string, competencia: string) {
  const calculado = await calcularRepasse(proprietarioId, competencia);
  if ("erro" in calculado) return calculado;

  const supabase = criarClienteSupabaseAdmin();

  const { data: repasse, error: erroRepasse } = await supabase
    .from("repasses")
    .upsert(
      {
        proprietario_id: calculado.proprietario_id,
        competencia: calculado.competencia,
        valor_bruto: calculado.valor_bruto,
        taxa_administracao: calculado.taxa_administracao,
        total_despesas: calculado.total_despesas,
        valor_liquido: calculado.valor_liquido,
        status: "calculado",
      },
      { onConflict: "proprietario_id,competencia" }
    )
    .select()
    .single();

  if (erroRepasse || !repasse) {
    return { erro: `Erro ao gravar repasse: ${erroRepasse?.message ?? ""}` };
  }

  const repasseId = (repasse as { id: string }).id;

  // Recria os itens do zero a cada geração — evita duplicar em recálculo.
  await supabase.from("repasse_itens").delete().eq("repasse_id", repasseId);
  if (calculado.itens.length > 0) {
    await supabase.from("repasse_itens").insert(
      calculado.itens.map((item) => ({ ...item, repasse_id: repasseId }))
    );
  }

  return { repasse, itens: calculado.itens };
}
