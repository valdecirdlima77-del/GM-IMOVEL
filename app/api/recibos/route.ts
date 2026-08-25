import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("recibos")
    .select(
      "*, pagamentos(id, valor_pago, data_pagamento, cobrancas(competencia, imoveis_alugados(endereco_completo, proprietarios(nome, telefone, email), inquilinos(nome, telefone, email))))"
    )
    .order("criado_em", { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ recibos: data });
}
