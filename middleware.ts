import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("gm_admin")?.value;
  const adminToken = process.env.ADMIN_TOKEN;

  const eAdmin = token && adminToken && token === adminToken;

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
