import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { agenteAutorizado } from "@/lib/auth/agente";
import { hojeNoEscritorio } from "@/lib/datas";
import { intervaloCompetencia, parseCompetencia } from "@/lib/financeiro/competencia";
import { arredondar } from "@/lib/repasses/calculo";

// GET /api/agente/financeiro?competencia=2026-10
//
// Resumo do mês do escritório: receitas lançadas, despesas dos imóveis e
// situação dos repasses. Somente leitura, em totais agregados. Não lista
// clientes nem valores individuais de proprietários.
export async function GET(request: NextRequest) {
  if (!agenteAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const competencia =
    parseCompetencia(request.nextUrl.searchParams.get("competencia")) ??
    (parseCompetencia(hojeNoEscritorio()) as string);
  const { inicio, fim } = intervaloCompetencia(competencia);

  const supabase = criarClienteSupabaseAdmin();
  const [
    { data: receitas, error: erroR },
    { data: despesas, error: erroD },
    { data: repasses, error: erroP },
  ] = await Promise.all([
    supabase.from("receitas").select("valor").gte("data_receita", inicio).lte("data_receita", fim),
    supabase.from("despesas").select("valor").eq("competencia", competencia),
    supabase.from("repasses").select("status, valor_liquido").eq("competencia", competencia),
  ]);
  // Erro de banco nunca pode virar zero: o agente informaria "nada a receber".
  if (erroR || erroD || erroP) {
    return NextResponse.json({ erro: "Não foi possível consultar o financeiro agora." }, { status: 500 });
  }

  const soma = (lista: { valor?: unknown; valor_liquido?: unknown }[] | null, campo: "valor" | "valor_liquido") =>
    arredondar((lista ?? []).reduce((s, i) => s + Number(i[campo] ?? 0), 0));

  const porStatus = { calculado: 0, confirmado: 0, pago: 0 } as Record<string, number>;
  for (const r of repasses ?? []) {
    porStatus[r.status as string] = (porStatus[r.status as string] ?? 0) + 1;
  }

  return NextResponse.json({
    competencia,
    receitas_total: soma(receitas, "valor"),
    despesas_imoveis_total: soma(despesas, "valor"),
    repasses: {
      total: (repasses ?? []).length,
      por_status: porStatus,
      liquido_total: soma(repasses, "valor_liquido"),
    },
  });
}
