import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso em componentes do lado do cliente (browser).
// Aqui só entra chave pública — nunca a privilegiada (ver `credenciais.ts`).
//
// As variáveis são lidas literalmente de `process.env` (e não pelos helpers de
// `credenciais.ts`) porque o Next.js só substitui `NEXT_PUBLIC_*` pelo valor
// real no código do navegador quando o nome aparece escrito por extenso aqui.
//
// Aceita os dois nomes: `ANON_KEY` (legado, digitado à mão) e
// `PUBLISHABLE_KEY` (escrito pela integração oficial Supabase↔Vercel).
export function criarClienteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Supabase não configurado: faltam NEXT_PUBLIC_SUPABASE_URL e a chave pública."
    );
  }

  return createBrowserClient(url, chave);
}
