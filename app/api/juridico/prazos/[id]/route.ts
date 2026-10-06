import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { hojeNoEscritorio } from "@/lib/datas";

type Contexto = { params: { id: string } };

// Marca ou desmarca o prazo como cumprido. Não há DELETE: prazo processual é
// registro de controle, e apagar um prazo fatal esconderia a informação.
export async function PATCH(request: NextRequest, { params }: Contexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof payload?.concluido !== "boolean") {
    return NextResponse.json({ erro: "Informe se o prazo está concluído." }, { status: 400 });
  }
  const concluido = payload.concluido;
  const hoje = hojeNoEscritorio();

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("prazos_processuais")
    .update({ concluido, data_conclusao: concluido ? hoje : null })
    .eq("id", params.id)
    .select("id, concluido, data_conclusao")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ erro: "Não foi possível atualizar o prazo." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ erro: "Prazo não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ prazo: data });
}
