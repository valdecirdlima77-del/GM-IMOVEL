import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { senha } = await request.json();

  const senhaAdmin = process.env.ADMIN_SENHA;

  if (!senhaAdmin || senha !== senhaAdmin) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("gm_admin", process.env.ADMIN_TOKEN!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
  });

  return response;
}
