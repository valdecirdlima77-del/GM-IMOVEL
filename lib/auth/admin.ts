import type { NextRequest } from "next/server";

// Verificação de acesso administrativo para route handlers.
//
// O `middleware.ts` só cobre PÁGINAS (`/admin/:path*` e `/login`) — as rotas
// de API ficam fora do matcher dele. Rotas que gravam dados precisam, por
// isso, fazer esta checagem elas mesmas.
//
// Mantém o mesmo comportamento do middleware: se `ADMIN_TOKEN` ainda não foi
// configurado no ambiente, libera (evita travar um ambiente recém-criado).
export function requisicaoAutorizada(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return true;

  return request.cookies.get("gm_admin")?.value === adminToken;
}
