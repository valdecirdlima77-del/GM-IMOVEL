import { NextRequest, NextResponse } from "next/server";

// Rota do assistente virtual.
//
// PREPARADA para chamar a Agente Geisa de verdade, mas com resposta fixa
// como padrão de segurança: só troca de comportamento se as DUAS variáveis
// abaixo estiverem configuradas. Sem elas, continua devolvendo `RESPOSTA`
// fixa — nenhuma ligação acontece sem configuração explícita.
//
//   AGENTE_GEISA_URL    — ex.: https://agente-geisa.onrender.com
//   AGENTE_SECRET       — mesmo segredo usado em app/api/agente/* (Agente
//                          Geisa envia de volta como Authorization: Bearer)
//
// Ver docs/CATALOGO_INTEGRACAO_GM_ADMIN.md (repo da Agente Geisa) para o
// plano completo. Decisão de negócio pendente antes de configurar essas
// variáveis em Production: ligar já (com "nenhum imóvel no momento") ou só
// depois do 1º imóvel real cadastrado.

const RESPOSTA_FIXA =
  "Olá, sou a assistente virtual da Geisa. Em breve poderei ajudar você a encontrar imóveis e agendar visitas.";

const TIMEOUT_MS = 8000;

type CorpoRequisicao = {
  mensagem?: unknown;
  visitante_id?: unknown;
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

  const urlAgente = process.env.AGENTE_GEISA_URL;
  const segredo = process.env.AGENTE_SECRET;

  if (!urlAgente || !segredo) {
    return NextResponse.json({ resposta: RESPOSTA_FIXA });
  }

  const visitanteId =
    typeof corpo.visitante_id === "string" && corpo.visitante_id.trim()
      ? corpo.visitante_id
      : `anonimo-${Date.now()}`;

  try {
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);

    const resposta = await fetch(`${urlAgente.replace(/\/$/, "")}/api/chat/site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${segredo}`,
      },
      body: JSON.stringify({ mensagem: corpo.mensagem, visitante_id: visitanteId }),
      signal: controlador.signal,
    });
    clearTimeout(timeout);

    if (!resposta.ok) {
      return NextResponse.json({ resposta: RESPOSTA_FIXA });
    }

    const dados = (await resposta.json()) as { resposta?: string };
    return NextResponse.json({ resposta: dados.resposta || RESPOSTA_FIXA });
  } catch {
    // Agente Geisa fora do ar/lenta — nunca deixa o visitante sem resposta.
    return NextResponse.json({ resposta: RESPOSTA_FIXA });
  }
}
