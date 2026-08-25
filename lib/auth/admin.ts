import type { NextRequest } from "next/server";

// Verificação de acesso administrativo para route handlers.
//
// O `middleware.ts` só cobre PÁGINAS (`/admin/:path*` e `/login`) — as rotas
// de API ficam fora do matcher dele. Rotas que gravam dados precisam, por
// isso, fazer esta checagem elas mesmas.
//
// Sem `ADMIN_TOKEN` configurado, NEGA — mesma regra do middleware.
// Liberar nesse caso deixaria as rotas de escrita abertas em qualquer ambiente
// que esquecesse a variável, exatamente o cenário que quase se concretizou no
// segundo projeto da Vercel (ver o comentário em middleware.ts).
export function requisicaoAutorizada(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return false;

  return request.cookies.get("gm_admin")?.value === adminToken;
}
