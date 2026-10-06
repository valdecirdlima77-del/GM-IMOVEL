import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { intervaloCompetencia, parseCompetencia } from "@/lib/financeiro/competencia";

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const competencia = parseCompetencia(request.nextUrl.searchParams.get("competencia"));
  if (!competencia) {
    return NextResponse.json({ erro: "Competência inválida." }, { status: 400 });
  }
  const { inicio, fim } = intervaloCompetencia(competencia);

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("receitas")
    .select("id, descricao, valor, data_receita, categoria")
    .gte("data_receita", inicio)
    .lte("data_receita", fim)
    .order("data_receita", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível carregar as receitas." }, { status: 500 });
  }
  return NextResponse.json({ receitas: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const descricao = typeof payload?.descricao === "string" ? payload.descricao.trim() : "";
  const valor = Number(payload?.valor);
  const dataReceita = typeof payload?.data_receita === "string" ? payload.data_receita : "";

  if (!descricao) {
    return NextResponse.json({ erro: "Descreva a receita." }, { status: 400 });
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ erro: "Informe um valor maior que zero." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataReceita)) {
    return NextResponse.json({ erro: "Informe a data da receita." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("receitas")
    .insert({
      descricao,
      valor: Math.round(valor * 100) / 100,
      data_receita: dataReceita,
      categoria: typeof payload?.categoria === "string" && payload.categoria.trim() ? payload.categoria.trim() : null,
    })
    .select("id, descricao, valor, data_receita, categoria")
    .single();

  if (error || !data) {
    return NextResponse.json({ erro: "Não foi possível salvar a receita." }, { status: 500 });
  }
  return NextResponse.json({ receita: data }, { status: 201 });
}
