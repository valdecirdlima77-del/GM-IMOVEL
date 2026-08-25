import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

type RotaContexto = { params: { id: string } };

// Ação rápida usada na tela /admin/alugueis/cobrancas para mudar o status
// manualmente (ex.: cancelar uma cobrança). Para marcar como "pago" de
// verdade, use /api/pagamentos — ele mantém o histórico de pagamentos.
export async function PATCH(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { status } = (await request.json()) as { status: string };

  const { data, error } = await supabase
    .from("cobrancas")
    .update({ status })
    .eq("id", context.params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao atualizar cobrança: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ cobranca: data });
}
