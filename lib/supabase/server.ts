import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { urlSupabase, chavePublicaSupabase } from "./credenciais";

// Cliente Supabase para uso em Server Components e Route Handlers.
// Lê/escreve o cookie de sessão automaticamente para manter o login do usuário.
export function criarClienteSupabaseServidor() {
  const cookieStore = cookies();

  return createServerClient(
    urlSupabase(),
    chavePublicaSupabase(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
