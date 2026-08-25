import { NextRequest, NextResponse } from "next/server";

// Rota do assistente virtual — RESPOSTA FIXA.
//
// Ainda não há IA conectada: nenhum provedor externo, nenhuma biblioteca nova,
// nenhum acesso ao Supabase. Esta rota existe para fechar o circuito entre o
// ChatWidget e o servidor, com o contrato de dados já no formato definitivo.
//
// Quando o agente for ligado, o único ponto de troca é o valor de `RESPOSTA`
// abaixo — o formato de entrada e saída permanece o mesmo.

const RESPOSTA =
  "Olá, sou a assistente virtual da Geisa. Em breve poderei ajudar você a encontrar imóveis e agendar visitas.";

type CorpoRequisicao = {
  mensagem?: unknown;
};

export async function POST(request: NextRequest) {
  let corpo: CorpoRequisicao;

  try {
    corpo = (await request.json()) as CorpoRequisicao;
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido: esperado JSON." },
      { status: 400 }
    );
  }

  if (typeof corpo.mensagem !== "string" || !corpo.mensagem.trim()) {
    return NextResponse.json(
      { erro: "O campo 'mensagem' é obrigatório e deve ser um texto." },
      { status: 400 }
    );
  }

  return NextResponse.json({ resposta: RESPOSTA });
}
