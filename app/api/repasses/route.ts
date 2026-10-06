import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { parseCompetencia } from "@/lib/financeiro/competencia";
import { gerarRepassesDaCompetencia } from "@/lib/repasses/gerar";

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const competencia = parseCompetencia(request.nextUrl.searchParams.get("competencia"));
  if (!competencia) {
    return NextResponse.json({ erro: "Competência inválida." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("repasses")
    .select("id, valor_bruto, taxa_administracao, total_despesas, valor_liquido, status, data_repasse, proprietarios(nome)")
    .eq("competencia", competencia)
    .order("criado_em", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível carregar os repasses." }, { status: 500 });
  }
  return NextResponse.json({ repasses: data ?? [] });
}

// Gera ou recalcula os repasses da competência informada.
export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const payload = (await request.json().catch(() => null)) as { competencia?: unknown } | null;
  const competencia = parseCompetencia(typeof payload?.competencia === "string" ? payload.competencia : null);
  if (!competencia) {
    return NextResponse.json({ erro: "Competência inválida." }, { status: 400 });
  }

  try {
    const resultado = await gerarRepassesDaCompetencia(criarClienteSupabaseAdmin(), competencia);
    return NextResponse.json({ ok: true, ...resultado });
  } catch {
    return NextResponse.json({ erro: "Não foi possível gerar os repasses." }, { status: 500 });
  }
}
