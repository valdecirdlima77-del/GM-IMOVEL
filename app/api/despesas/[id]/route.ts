import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import type { PayloadDespesa } from "../route";

type RotaContexto = { params: { id: string } };

export async function PUT(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const payload = (await request.json()) as PayloadDespesa;

  const { data, error } = await supabase
    .from("despesas")
    .update({
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
    .eq("id", context.params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao atualizar despesa: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ despesa: data });
}

export async function DELETE(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { error } = await supabase.from("despesas").delete().eq("id", context.params.id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
