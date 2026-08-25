import type { NextRequest } from "next/server";

// Verificação de origem para as rotas de cron.
//
// Elas rodam sem sessão de usuário — quem chama é o agendador da Vercel, não a
// Geisa. Por isso não dá para usar o cookie `gm_admin`: precisam de um segredo
// próprio.
//
// A Vercel envia automaticamente o cabeçalho
// `Authorization: Bearer <CRON_SECRET>` nas execuções agendadas, desde que a
// variável `CRON_SECRET` exista no projeto.
//
// Sem essa proteção, qualquer pessoa que descobrisse a URL poderia disparar os
// jobs à vontade: marcar cobranças como atrasadas e provocar o envio de
// mensagens para inquilinos e proprietários.
//
// Mesma regra do painel: sem o segredo configurado, NEGA. Ver o comentário em
// `middleware.ts` sobre falhar fechado.
export function cronAutorizado(request: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;

  return request.headers.get("authorization") === `Bearer ${segredo}`;
}
