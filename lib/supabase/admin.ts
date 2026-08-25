import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com a chave "service_role" — ignora RLS.
//
// USO EXCLUSIVO EM CÓDIGO DE SERVIDOR (route handlers), NUNCA em componentes
// "use client" nem em qualquer arquivo que possa ser enviado ao navegador.
// É o que permite a rota de upload de fotos gravar no Storage e na tabela
// `fotos` sem depender de uma sessão de usuário autenticado — hoje o painel
// usa um cookie simples (`gm_admin`), não o Supabase Auth, então o cliente
// "anon" do navegador não teria permissão de escrita nessas tabelas.
export function criarClienteSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chaveServico) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL) não configurada."
    );
  }

  return createClient(url, chaveServico, {
    auth: { persistSession: false },
  });
}
