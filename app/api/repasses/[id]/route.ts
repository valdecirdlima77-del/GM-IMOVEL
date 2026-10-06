import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { hojeNoEscritorio } from "@/lib/datas";

type Contexto = { params: { id: string } };

// Avança o repasse: calculado -> confirmado -> pago. Não volta de estado.
const ORDEM = ["calculado", "confirmado", "pago"];

export async function PATCH(request: NextRequest, { params }: Contexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const payload = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const novo = typeof payload?.status === "string" ? payload.status : "";
  if (novo !== "confirmado" && novo !== "pago") {
    return NextResponse.json({ erro: "Status inválido para o repasse." }, { status: 400 });
  }

  const supabase = criarClienteSupabaseAdmin();
  const { data: atual, error: erroBusca } = await supabase
    .from("repasses")
    .select("id, status")
    .eq("id", params.id)
    .maybeSingle();
  if (erroBusca) {
    return NextResponse.json({ erro: "Não foi possível localizar o repasse." }, { status: 500 });
  }
  if (!atual) {
    return NextResponse.json({ erro: "Repasse não encontrado." }, { status: 404 });
  }
  if (ORDEM.indexOf(novo) <= ORDEM.indexOf(atual.status as string)) {
    return NextResponse.json({ erro: "Este repasse já está nesse estado ou além." }, { status: 409 });
  }

  const { error } = await supabase
    .from("repasses")
    .update({
      status: novo,
      data_repasse: novo === "pago" ? hojeNoEscritorio() : null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ erro: "Não foi possível atualizar o repasse." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status: novo });
}
