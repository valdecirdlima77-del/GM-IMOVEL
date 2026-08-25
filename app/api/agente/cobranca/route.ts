import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { agenteAutorizado } from "@/lib/auth/agente";

// GET /api/agente/cobranca?telefone=5567999999999
//
// Devolve a cobrança do mês corrente do INQUILINO dono desse telefone —
// nunca uma lista, nunca a cobrança de outro contato. Se o telefone não
// bater com nenhum inquilino cadastrado, devolve 404: a Agente Geisa deve
// tratar isso como "não achei", nunca inventar um valor.
//
// Telefone precisa bater exatamente com o que está gravado em
// `inquilinos.telefone` ou `inquilinos.whatsapp` (mesmo formato usado no
// cadastro do admin). Normalização de formato fica para uma v2, se
// necessário.
export async function GET(request: NextRequest) {
  if (!agenteAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const telefone = request.nextUrl.searchParams.get("telefone");
  if (!telefone) {
    return NextResponse.json({ erro: "Parâmetro telefone é obrigatório." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();

  const { data: inquilino } = await supabase
    .from("inquilinos")
    .select("id, nome")
    .or(`telefone.eq.${telefone},whatsapp.eq.${telefone}`)
    .limit(1)
    .maybeSingle();

  if (!inquilino) {
    return NextResponse.json({ erro: "Nenhum inquilino encontrado para esse telefone." }, { status: 404 });
  }

  const { data: locacoes } = await supabase
    .from("imoveis_alugados")
    .select("id, endereco_completo")
    .eq("inquilino_id", inquilino.id)
    .eq("status", "ativo");

  const locacaoIds = (locacoes ?? []).map((l) => l.id as string);
  if (locacaoIds.length === 0) {
    return NextResponse.json({ erro: "Nenhuma locação ativa encontrada." }, { status: 404 });
  }

  const competenciaAtual = new Date().toISOString().slice(0, 7) + "-01";

  const { data: cobrancas } = await supabase
    .from("cobrancas")
    .select("id, competencia, data_vencimento, valor_previsto, status, imovel_alugado_id")
    .in("imovel_alugado_id", locacaoIds)
    .order("data_vencimento", { ascending: false })
    .limit(5);

  const doMes = (cobrancas ?? []).find((c) => c.competencia === competenciaAtual);
  const maisRecente = doMes ?? (cobrancas ?? [])[0];

  if (!maisRecente) {
    return NextResponse.json({ erro: "Nenhuma cobrança encontrada." }, { status: 404 });
  }

  const locacao = (locacoes ?? []).find((l) => l.id === maisRecente.imovel_alugado_id);

  return NextResponse.json({
    inquilino: inquilino.nome,
    imovel: locacao?.endereco_completo ?? null,
    competencia: maisRecente.competencia,
    vencimento: maisRecente.data_vencimento,
    valor: maisRecente.valor_previsto,
    status: maisRecente.status,
  });
}
