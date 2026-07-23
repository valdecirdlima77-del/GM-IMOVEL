import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import type { PayloadImovelAlugado } from "../route";

type RotaContexto = { params: { id: string } };

export async function PUT(request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadImovelAlugado;

  const { data, error } = await supabase
    .from("imoveis_alugados")
    .update({
      imovel_id: payload.imovel_id || null,
      proprietario_id: payload.proprietario_id,
      inquilino_id: payload.inquilino_id || null,
      endereco_completo: payload.endereco_completo,
      valor_aluguel: payload.valor_aluguel,
      dia_vencimento: payload.dia_vencimento || 5,
      status: payload.status || "ativo",
      data_inicio: payload.data_inicio,
      data_fim: payload.data_fim || null,
    })
    .eq("id", context.params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao atualizar locação: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ imovel_alugado: data });
}
