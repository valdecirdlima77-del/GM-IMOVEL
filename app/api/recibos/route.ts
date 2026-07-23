import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export async function GET() {
  const supabase = criarClienteSupabaseServidor();
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
