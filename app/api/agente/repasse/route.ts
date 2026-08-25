import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { agenteAutorizado } from "@/lib/auth/agente";

// GET /api/agente/repasse?telefone=5567999999999
//
// Devolve o repasse do mês corrente do PROPRIETÁRIO dono desse telefone —
// nunca de outro proprietário. Se não houver repasse calculado ainda para
// este mês, devolve 404 (a Agente Geisa não deve afirmar um valor que não
// existe).
export async function GET(request: NextRequest) {
  if (!agenteAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const telefone = request.nextUrl.searchParams.get("telefone");
  if (!telefone) {
    return NextResponse.json({ erro: "Parâmetro telefone é obrigatório." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();

  const { data: proprietario } = await supabase
    .from("proprietarios")
    .select("id, nome")
    .eq("telefone", telefone)
    .limit(1)
    .maybeSingle();

  if (!proprietario) {
    return NextResponse.json({ erro: "Nenhum proprietário encontrado para esse telefone." }, { status: 404 });
  }

  const competenciaAtual = new Date().toISOString().slice(0, 7) + "-01";

  const { data: repasse } = await supabase
    .from("repasses")
    .select("competencia, valor_bruto, taxa_administracao, total_despesas, valor_liquido, status")
    .eq("proprietario_id", proprietario.id)
    .eq("competencia", competenciaAtual)
    .maybeSingle();

  if (!repasse) {
    return NextResponse.json(
      { erro: "Repasse deste mês ainda não foi calculado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    proprietario: proprietario.nome,
    competencia: repasse.competencia,
    valor_bruto: repasse.valor_bruto,
    taxa_administracao: repasse.taxa_administracao,
    total_despesas: repasse.total_despesas,
    valor_liquido: repasse.valor_liquido,
    status: repasse.status,
  });
}
