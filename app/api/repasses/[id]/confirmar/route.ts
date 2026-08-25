import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

type RotaContexto = { params: { id: string } };

// POST /api/repasses/[id]/confirmar { comprovante_url? }
// Marca o repasse como pago (o dinheiro já saiu para o proprietário).
export async function POST(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { comprovante_url: comprovanteUrl } = (await request
    .json()
    .catch(() => ({}))) as { comprovante_url?: string };

  const { data, error } = await supabase
    .from("repasses")
    .update({
      status: "pago",
      data_repasse: new Date().toISOString().slice(0, 10),
      comprovante_url: comprovanteUrl || null,
    })
    .eq("id", context.params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao confirmar repasse: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ repasse: data });
}
