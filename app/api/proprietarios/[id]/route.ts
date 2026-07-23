import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import type { PayloadProprietario } from "../route";

type RotaContexto = { params: { id: string } };

export async function PUT(request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadProprietario;

  const { data, error } = await supabase
    .from("proprietarios")
    .update({
      nome: payload.nome,
      cpf_cnpj: payload.cpf_cnpj || null,
      email: payload.email || null,
      telefone: payload.telefone,
      banco: payload.banco || null,
      agencia: payload.agencia || null,
      conta: payload.conta || null,
      tipo_conta: payload.tipo_conta || null,
      chave_pix: payload.chave_pix || null,
      comissao_percentual: payload.comissao_percentual ?? 10,
      observacoes: payload.observacoes || null,
      ativo: payload.ativo ?? true,
    })
    .eq("id", context.params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao atualizar proprietário: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ proprietario: data });
}

export async function DELETE(_request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const { error } = await supabase
    .from("proprietarios")
    .update({ ativo: false })
    .eq("id", context.params.id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
