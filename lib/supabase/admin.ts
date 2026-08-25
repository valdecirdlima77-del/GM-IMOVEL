import { createClient } from "@supabase/supabase-js";
import { urlSupabase, chaveSecretaSupabase } from "./credenciais";

// Cliente Supabase com a chave "service_role" — ignora RLS.
//
// USO EXCLUSIVO EM CÓDIGO DE SERVIDOR (route handlers), NUNCA em componentes
// "use client" nem em qualquer arquivo que possa ser enviado ao navegador.
// É o que permite a rota de upload de fotos gravar no Storage e na tabela
// `fotos` sem depender de uma sessão de usuário autenticado — hoje o painel
// usa um cookie simples (`gm_admin`), não o Supabase Auth, então o cliente
// "anon" do navegador não teria permissão de escrita nessas tabelas.
// Aceita tanto `SUPABASE_SERVICE_ROLE_KEY` (legado) quanto `SUPABASE_SECRET_KEY`
// (escrita pela integração oficial Supabase↔Vercel) — ver `credenciais.ts`.
export function criarClienteSupabaseAdmin() {
  return createClient(urlSupabase(), chaveSecretaSupabase(), {
    auth: { persistSession: false },
  });
}
