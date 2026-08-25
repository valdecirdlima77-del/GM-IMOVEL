import { NextRequest, NextResponse } from "next/server";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { gerarDemonstrativoRepasse } from "@/lib/repasses/gerar-demonstrativo";

type RotaContexto = { params: { id: string } };

export async function POST(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const resultado = await gerarDemonstrativoRepasse(context.params.id);
  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 500 });
  }

  return NextResponse.json(resultado);
}
