import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

export type PayloadDespesa = {
  imovel_alugado_id: string;
  tipo: string;
  descricao: string;
  valor: number;
  competencia: string; // YYYY-MM-01
  pago_por: string;
  repassavel: boolean;
  comprovante_url: string;
  observacoes: string;
};

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("despesas")
    .select(
      "*, imoveis_alugados(endereco_completo, proprietarios(nome))"
    )
    .order("competencia", { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ despesas: data });
}

export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const payload = (await request.json()) as PayloadDespesa;

  if (!payload.imovel_alugado_id || !payload.descricao || !payload.valor || !payload.competencia) {
    return NextResponse.json(
      { erro: "Imóvel, descrição, valor e competência são obrigatórios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("despesas")
    .insert({
      imovel_alugado_id: payload.imovel_alugado_id,
      tipo: payload.tipo || "outra",
      descricao: payload.descricao,
      valor: payload.valor,
      competencia: payload.competencia,
      pago_por: payload.pago_por || "proprietario",
      repassavel: payload.repassavel ?? true,
      comprovante_url: payload.comprovante_url || null,
      observacoes: payload.observacoes || null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao salvar despesa: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ despesa: data }, { status: 201 });
}
