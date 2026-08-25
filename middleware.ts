import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("gm_admin")?.value;
  const adminToken = process.env.ADMIN_TOKEN;

  // Sem ADMIN_TOKEN configurado, o painel fica FECHADO.
  //
  // O comportamento anterior era o oposto — liberava o acesso — para facilitar
  // um ambiente recém-criado. Isso se mostrou perigoso: um segundo projeto na
  // Vercel apontando para o mesmo repositório ficou sem essas variáveis e, no
  // momento em que recebeu credenciais válidas de banco, o painel
  // administrativo (com dados de inquilinos e financeiro) passaria a responder
  // sem pedir senha a qualquer visitante.
  //
  // Falhar fechado troca um erro invisível e grave por um erro visível e
  // inofensivo: sem a variável, ninguém entra — nem quem deveria.
  if (!adminToken) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const eAdmin = token === adminToken;

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!eAdmin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (request.nextUrl.pathname === "/login" && eAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
