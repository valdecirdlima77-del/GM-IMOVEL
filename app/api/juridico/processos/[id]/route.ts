import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

const STATUS_PROCESSO = ["ativo", "encerrado", "suspenso", "arquivado"];

type Contexto = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Contexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const status = typeof payload?.status === "string" ? payload.status : "";
  if (!STATUS_PROCESSO.includes(status)) {
    return NextResponse.json({ erro: "Status de processo inválido." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("processos_juridicos")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", params.id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ erro: "Não foi possível atualizar o processo." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ erro: "Processo não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ processo: data });
}
