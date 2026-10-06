import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const processoId = typeof payload?.processo_id === "string" ? payload.processo_id : "";
  const descricao = typeof payload?.descricao === "string" ? payload.descricao.trim() : "";
  const dataPrazo = typeof payload?.data_prazo === "string" ? payload.data_prazo : "";

  if (!processoId) {
    return NextResponse.json({ erro: "Processo não informado." }, { status: 400 });
  }
  if (!descricao) {
    return NextResponse.json({ erro: "Descreva o prazo." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPrazo)) {
    return NextResponse.json({ erro: "Informe a data fatal do prazo." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("prazos_processuais")
    .insert({ processo_id: processoId, descricao, data_prazo: dataPrazo })
    .select("id, descricao, data_prazo, concluido")
    .single();

  if (error || !data) {
    return NextResponse.json({ erro: "Não foi possível salvar o prazo." }, { status: 500 });
  }
  return NextResponse.json({ prazo: data }, { status: 201 });
}
