import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularRepasse, ValorRecebido } from "@/lib/repasses/calculo";

export type ResultadoGeracao = {
  competencia: string;
  criados: number;
  recalculados: number;
  ignorados_ja_fechados: number;
  sem_movimento: number;
};

type Proprietario = { id: string; nome: string; comissao_percentual: number };

// Gera (ou recalcula) o repasse de cada proprietário da competência.
// - Entram: aluguéis com cobrança `pago` no mês e despesas do imóvel marcadas
//   como repassáveis e pagas pelo proprietário.
// - Repasse já `confirmado` ou `pago` nunca é recalculado: o dinheiro já
//   foi combinado/enviado e mudar os números depois quebraria o registro.
export async function gerarRepassesDaCompetencia(
  supabase: SupabaseClient,
  competencia: string
): Promise<ResultadoGeracao> {
  const resultado: ResultadoGeracao = {
    competencia,
    criados: 0,
    recalculados: 0,
    ignorados_ja_fechados: 0,
    sem_movimento: 0,
  };

  const { data: proprietarios, error: erroProp } = await supabase
    .from("proprietarios")
    .select("id, nome, comissao_percentual")
    .eq("ativo", true);
  if (erroProp) throw new Error(erroProp.message);

  const { data: locacoes, error: erroLoc } = await supabase
    .from("imoveis_alugados")
    .select("id, proprietario_id, endereco_completo");
  if (erroLoc) throw new Error(erroLoc.message);

  const locacaoPorId = new Map(
    (locacoes ?? []).map((l) => [l.id as string, l as { id: string; proprietario_id: string; endereco_completo: string }])
  );

  const { data: cobrancas, error: erroCob } = await supabase
    .from("cobrancas")
    .select("imovel_alugado_id, valor_previsto")
    .eq("competencia", competencia)
    .eq("status", "pago");
  if (erroCob) throw new Error(erroCob.message);

  const { data: despesas, error: erroDesp } = await supabase
    .from("despesas")
    .select("id, imovel_alugado_id, descricao, valor")
    .eq("competencia", competencia)
    .eq("repassavel", true)
    .eq("pago_por", "proprietario");
  if (erroDesp) throw new Error(erroDesp.message);

  const alugueisPorProp = new Map<string, ValorRecebido[]>();
  for (const c of cobrancas ?? []) {
    const loc = locacaoPorId.get(c.imovel_alugado_id as string);
    if (!loc) continue;
    const lista = alugueisPorProp.get(loc.proprietario_id) ?? [];
    lista.push({ descricao: `Aluguel — ${loc.endereco_completo}`, valor: Number(c.valor_previsto) });
    alugueisPorProp.set(loc.proprietario_id, lista);
  }

  const despesasPorProp = new Map<string, ValorRecebido[]>();
  for (const d of despesas ?? []) {
    const loc = locacaoPorId.get(d.imovel_alugado_id as string);
    if (!loc) continue;
    const lista = despesasPorProp.get(loc.proprietario_id) ?? [];
    lista.push({ descricao: `${d.descricao} — ${loc.endereco_completo}`, valor: Number(d.valor) });
    despesasPorProp.set(loc.proprietario_id, lista);
  }

  for (const prop of (proprietarios ?? []) as Proprietario[]) {
    const alugueis = alugueisPorProp.get(prop.id) ?? [];
    const despesasProp = despesasPorProp.get(prop.id) ?? [];
    if (alugueis.length === 0 && despesasProp.length === 0) {
      resultado.sem_movimento += 1;
      continue;
    }

    const calc = calcularRepasse({
      alugueisPagos: alugueis,
      despesasRepassaveis: despesasProp,
      comissaoPercentual: Number(prop.comissao_percentual),
    });

    const { data: existente, error: erroExist } = await supabase
      .from("repasses")
      .select("id, status")
      .eq("proprietario_id", prop.id)
      .eq("competencia", competencia)
      .maybeSingle();
    if (erroExist) throw new Error(erroExist.message);

    if (existente && existente.status !== "calculado") {
      resultado.ignorados_ja_fechados += 1;
      continue;
    }

    const campos = {
      valor_bruto: calc.valor_bruto,
      taxa_administracao: calc.taxa_administracao,
      total_despesas: calc.total_despesas,
      valor_liquido: calc.valor_liquido,
      atualizado_em: new Date().toISOString(),
    };

    let repasseId: string;
    if (existente) {
      const { error } = await supabase.from("repasses").update(campos).eq("id", existente.id);
      if (error) throw new Error(error.message);
      const { error: erroDel } = await supabase.from("repasse_itens").delete().eq("repasse_id", existente.id);
      if (erroDel) throw new Error(erroDel.message);
      repasseId = existente.id as string;
      resultado.recalculados += 1;
    } else {
      const { data: novo, error } = await supabase
        .from("repasses")
        .insert({ proprietario_id: prop.id, competencia, status: "calculado", ...campos })
        .select("id")
        .single();
      if (error || !novo) throw new Error(error?.message ?? "Falha ao criar repasse.");
      repasseId = novo.id as string;
      resultado.criados += 1;
    }

    const { error: erroItens } = await supabase.from("repasse_itens").insert(
      calc.itens.map((i) => ({
        repasse_id: repasseId,
        tipo: i.tipo,
        sinal: i.sinal,
        descricao: i.descricao,
        valor: i.valor,
      }))
    );
    if (erroItens) throw new Error(erroItens.message);
  }

  return resultado;
}
