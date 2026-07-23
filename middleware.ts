import { NextResponse, type NextRequest } from "next/server";

// Middleware temporariamente desativado — acesso livre ao admin
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
