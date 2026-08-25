// Leitura centralizada das credenciais do Supabase.
//
// ORDEM DE PRIORIDADE: primeiro os nomes escritos pela integração oficial
// Supabase↔Vercel, depois os antigos digitados à mão.
//
// O motivo é concreto: a integração NÃO consegue sobrescrever uma variável que
// já existe com o mesmo nome — ela falha com "A variable with the name X
// already exists". Foi o que aconteceu aqui: `NEXT_PUBLIC_SUPABASE_URL` e
// `NEXT_PUBLIC_SUPABASE_ANON_KEY`, criadas à mão em 23/07 apontando para um
// projeto Supabase que não existe mais, bloquearam a escrita das novas.
//
// As demais variáveis da integração passaram normalmente. Então os valores
// corretos ESTÃO no ambiente, só com outros nomes:
//
//   valor correto (integração)              valor obsoleto (23/07)
//   SUPABASE_URL                         →  NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY →  NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY / SECRET_KEY  (não existia antes)
//
// Preferir os nomes da integração resolve sem depender de apagar variável
// nenhuma no painel. Os nomes antigos seguem aceitos como alternativa, para
// que o ambiente local (`.env.local`) continue funcionando igual.

export function urlSupabase(): string {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error(
      "Endereço do Supabase não configurado (SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL)."
    );
  }
  return url;
}

// Chave pública — pode ir para o navegador, protegida pelas políticas de RLS.
export function chavePublicaSupabase(): string {
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!chave) {
    throw new Error(
      "Chave pública do Supabase não configurada (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return chave;
}

// Chave privilegiada — ignora RLS. NUNCA deve chegar ao navegador.
export function chaveSecretaSupabase(): string {
  const chave =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!chave) {
    throw new Error(
      "Chave privilegiada do Supabase não configurada (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY)."
    );
  }
  return chave;
}
