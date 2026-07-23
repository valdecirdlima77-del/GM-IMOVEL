import { NextResponse } from "next/server";

export async function GET() {
  const check = (name: string) => {
    const v = process.env[name];
    if (!v) return { present: false };
    const badChars: { pos: number; code: number }[] = [];
    for (let i = 0; i < v.length; i++) {
      const c = v.charCodeAt(i);
      if (c > 255) badChars.push({ pos: i, code: c });
    }
    return {
      present: true,
      length: v.length,
      first10: v.slice(0, 10),
      last10: v.slice(-10),
      badChars: badChars.slice(0, 5),
    };
  };
  return NextResponse.json({
    url: check("NEXT_PUBLIC_SUPABASE_URL"),
    anon: check("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    adminSenha: check("ADMIN_SENHA"),
    adminToken: check("ADMIN_TOKEN"),
    serviceRole: check("SUPABASE_SERVICE_ROLE_KEY"),
  });
}
