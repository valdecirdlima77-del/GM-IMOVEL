import { NextRequest, NextResponse } from "next/server";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { calcularRepasse } from "@/lib/repasses/calcular-repasse";

// POST /api/repasses/calcular { proprietario_id, competencia }
// Prévia do repasse SEM gravar — usada para a tela mostrar o valor antes de
// o usuário confirmar a geração.
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

  const resultado = await calcularRepasse(proprietarioId, competencia);
  if ("erro" in resultado) {
    return NextResponse.json({ erro: resultado.erro }, { status: 500 });
  }

  return NextResponse.json(resultado);
}
