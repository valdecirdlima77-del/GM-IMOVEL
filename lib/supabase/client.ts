import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso em componentes do lado do cliente (browser).
// Aqui só entra chave pública — nunca a privilegiada (ver `credenciais.ts`).
//
// As variáveis são lidas literalmente de `process.env` (e não pelos helpers de
// `credenciais.ts`) porque o Next.js só substitui esses nomes pelo valor real
// no pacote do navegador quando aparecem escritos por extenso aqui.
//
// `NEXT_PUBLIC_SUPABASE_URL_EFETIVA` é montada em `next.config.js` a partir da
// `SUPABASE_URL` da integração — necessário porque a `NEXT_PUBLIC_SUPABASE_URL`
// existente é a antiga, de 23/07, e a integração não pode sobrescrevê-la.
export function criarClienteSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL_EFETIVA ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Supabase não configurado: falta o endereço ou a chave pública."
    );
  }

  return createBrowserClient(url, chave);
}
