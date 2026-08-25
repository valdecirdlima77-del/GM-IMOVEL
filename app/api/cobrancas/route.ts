import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("cobrancas")
    .select(
      "*, imoveis_alugados(id, endereco_completo, valor_aluguel, proprietarios(nome), inquilinos(nome))"
    )
    .order("data_vencimento", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ cobrancas: data });
}
