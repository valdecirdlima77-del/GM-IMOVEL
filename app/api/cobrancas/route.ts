import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export async function GET() {
  const supabase = criarClienteSupabaseServidor();
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
