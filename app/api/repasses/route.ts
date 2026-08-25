import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { gerarRepasse } from "@/lib/repasses/calcular-repasse";

export async function GET(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("repasses")
    .select("*, proprietarios(nome, chave_pix)")
    .order("competencia", { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ repasses: data });
}

// POST /api/repasses { proprietario_id, competencia }
// Calcula e GRAVA o repasse (upsert por proprietário+competência). Para só
// pré-visualizar sem gravar, usar /api/repasses/calcular.
export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const { proprietario_id: proprietarioId, competencia } = (await request.json()) as {
    proprietario_id: string;
    competencia: string;
  };

  if (!proprietarioId || !competencia) {
    return NextResponse.json(
      { erro: "proprietario_id e competencia são obrigatórios." },
      { status: 400 }
    );
  }

  const resultado = await gerarRepasse(proprietarioId, competencia);
  if ("erro" in resultado) {
    return NextResponse.json({ erro: resultado.erro }, { status: 500 });
  }

  return NextResponse.json(resultado, { status: 201 });
}
