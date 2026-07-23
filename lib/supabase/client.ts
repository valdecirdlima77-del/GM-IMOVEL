import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso em componentes do lado do cliente (browser).
// As chaves vêm do .env.local — nunca coloque a chave "service_role" aqui,
// apenas a chave "anon" (pública, protegida pelas políticas de RLS).
export function criarClienteSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
