// Leitura centralizada das credenciais do Supabase.
//
// Existem dois conjuntos de nomes em circulação:
//
//   nome antigo (legado)              nome novo (integração Supabase↔Vercel)
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  →  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
//   SUPABASE_SERVICE_ROLE_KEY      →  SUPABASE_SECRET_KEY
//
// O Supabase renomeou as chaves (`anon` virou "publishable", `service_role`
// virou "secret") e a integração oficial com a Vercel escreve apenas os nomes
// novos. Aceitar os dois evita que o site quebre dependendo de como o ambiente
// foi configurado — por variável digitada à mão ou pela integração automática.
//
// A URL também tem duas formas: `NEXT_PUBLIC_SUPABASE_URL` (usada pelo código
// do navegador) e `SUPABASE_URL` (escrita pela integração).

export function urlSupabase(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!url) {
    throw new Error(
      "Endereço do Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL)."
    );
  }
  return url;
}

// Chave pública — pode ir para o navegador, protegida pelas políticas de RLS.
export function chavePublicaSupabase(): string {
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!chave) {
    throw new Error(
      "Chave pública do Supabase não configurada (NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
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
