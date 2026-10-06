import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

const TIPOS_CLIENTE =["inquilino", "proprietario", "cliente_advocacia", "lead"] as const;

const POR_PAGINA = 20;

// Remove caracteres com significado no filtro do PostgREST e nos curingas do
// ILIKE, para que a busca digitada nunca quebre a consulta.
function termoSeguro(q: string): string {
  return q.replace(/[,()%_*\\]/g, " ").trim();
}

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = termoSeguro(params.get("q") ?? "");
  const tipo = params.get("tipo") ?? "";
  const pagina = Math.max(1, Number(params.get("pagina") ?? 1) || 1);
  const inicio = (pagina - 1) * POR_PAGINA;

  const supabase = criarClienteSupabaseAdmin();
  let consulta = supabase
    .from("clientes_unificados")
    .select("id, nome, cpf_cnpj, email, telefone, tipo, notas", { count: "exact" })
    .order("nome", { ascending: true })
    .range(inicio, inicio + POR_PAGINA - 1);

  if (q) {
    consulta = consulta.or(`nome.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,telefone.ilike.%${q}%`);
  }
  if (tipo && (TIPOS_CLIENTE as readonly string[]).includes(tipo)) {
    consulta = consulta.eq("tipo", tipo);
  }

  const { data, error, count } = await consulta;
  if (error) {
    return NextResponse.json({ erro: "Não foi possível carregar os clientes." }, { status: 500 });
  }
  return NextResponse.json({
    clientes: data ?? [],
    total: count ?? 0,
    pagina,
    por_pagina: POR_PAGINA,
  });
}

export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const nome = typeof payload?.nome === "string" ? payload.nome.trim() : "";
  const tipo = typeof payload?.tipo === "string" ? payload.tipo : "";

  if (!nome) {
    return NextResponse.json({ erro: "Informe o nome do cliente." }, { status: 400 });
  }
  if (!(TIPOS_CLIENTE as readonly string[]).includes(tipo)) {
    return NextResponse.json({ erro: "Escolha o tipo do cliente." }, { status: 400 });
  }

  const texto = (valor: unknown) => (typeof valor === "string" && valor.trim() ? valor.trim() : null);

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("clientes_unificados")
    .insert({
      nome,
      tipo,
      cpf_cnpj: texto(payload?.cpf_cnpj),
      email: texto(payload?.email),
      telefone: texto(payload?.telefone),
      notas: texto(payload?.notas),
    })
    .select("id, nome, cpf_cnpj, email, telefone, tipo, notas")
    .single();

  if (error || !data) {
    return NextResponse.json({ erro: "Não foi possível salvar o cliente." }, { status: 500 });
  }
  return NextResponse.json({ cliente: data }, { status: 201 });
}
