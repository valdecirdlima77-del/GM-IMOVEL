import type { NextRequest } from "next/server";

// Verificação de origem para as rotas de leitura consumidas pela Agente
// Geisa (`app/api/agente/*`).
//
// Segredo PRÓPRIO (`AGENTE_SECRET`), separado do `ADMIN_TOKEN` (painel
// humano) e do `CRON_SECRET` (agendador da Vercel) — são três origens
// diferentes, cada uma só deve conseguir o que precisa. Misturar segredos
// faria revogar o acesso de um significar revogar o de todos.
//
// A Agente Geisa (Render, sistema separado) envia
// `Authorization: Bearer <AGENTE_SECRET>`.
//
// Mesma regra de "falhar fechado" das demais checagens deste projeto: sem o
// segredo configurado, NEGA.
export function agenteAutorizado(request: NextRequest): boolean {
  const segredo = process.env.AGENTE_SECRET;
  if (!segredo) return false;

  return request.headers.get("authorization") === `Bearer ${segredo}`;
}
