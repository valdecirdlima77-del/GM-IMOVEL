import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import type { PayloadInquilino } from "../route";

type RotaContexto = { params: { id: string } };

export async function PUT(request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadInquilino;

  const { data, error } = await supabase
    .from("inquilinos")
    .update({
      nome: payload.nome,
      cpf: payload.cpf || null,
      rg: payload.rg || null,
      email: payload.email || null,
      telefone: payload.telefone,
      whatsapp: payload.whatsapp || null,
      comprovante_renda_url: payload.comprovante_renda_url || null,
      renda_declarada: payload.renda_declarada,
      fiador_nome: payload.fiador_nome || null,
      fiador_telefone: payload.fiador_telefone || null,
      observacoes: payload.observacoes || null,
      ativo: payload.ativo ?? true,
    })
    .eq("id", context.params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao atualizar inquilino: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ inquilino: data });
}

export async function DELETE(_request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const { error } = await supabase
    .from("inquilinos")
    .update({ ativo: false })
    .eq("id", context.params.id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
