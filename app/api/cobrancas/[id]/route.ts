import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type RotaContexto = { params: { id: string } };

// Ação rápida usada na tela /admin/alugueis/cobrancas para mudar o status
// manualmente (ex.: cancelar uma cobrança). Para marcar como "pago" de
// verdade, use /api/pagamentos — ele mantém o histórico de pagamentos.
export async function PATCH(request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
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
