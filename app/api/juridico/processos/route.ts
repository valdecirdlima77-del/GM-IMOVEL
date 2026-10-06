import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

const STATUS_PROCESSO =["ativo", "encerrado", "suspenso", "arquivado"] as const;

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get("status") ?? "";

  const supabase = criarClienteSupabaseAdmin();
  let consulta = supabase
    .from("processos_juridicos")
    .select("id, numero_processo, tipo, descricao, status, vara, comarca, cliente_id, criado_em")
    .order("criado_em", { ascending: false });

  if (status && (STATUS_PROCESSO as readonly string[]).includes(status)) {
    consulta = consulta.eq("status", status);
  }

  const { data, error } = await consulta;
  if (error) {
    return NextResponse.json({ erro: "Não foi possível carregar os processos." }, { status: 500 });
  }
  return NextResponse.json({ processos: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const tipo = typeof payload?.tipo === "string" ? payload.tipo.trim() : "";
  const texto = (valor: unknown) => (typeof valor === "string" && valor.trim() ? valor.trim() : null);

  if (!tipo) {
    return NextResponse.json({ erro: "Informe o tipo de ação." }, { status: 400 });
  }
  const dataDistribuicao = texto(payload?.data_distribuicao);
  if (dataDistribuicao && !/^\d{4}-\d{2}-\d{2}$/.test(dataDistribuicao)) {
    return NextResponse.json({ erro: "Data de distribuição inválida." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("processos_juridicos")
    .insert({
      tipo,
      numero_processo: texto(payload?.numero_processo),
      descricao: texto(payload?.descricao),
      vara: texto(payload?.vara),
      comarca: texto(payload?.comarca),
      data_distribuicao: dataDistribuicao,
      cliente_id: texto(payload?.cliente_id),
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ erro: "Não foi possível salvar o processo." }, { status: 500 });
  }
  return NextResponse.json({ processo: data }, { status: 201 });
}
