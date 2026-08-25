/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // O endereço do Supabase correto chega do ambiente como `SUPABASE_URL`
  // (escrita pela integração oficial), que é uma variável de SERVIDOR — o
  // código do navegador não enxerga. O `NEXT_PUBLIC_SUPABASE_URL` existente é
  // o antigo, de 23/07, apontando para um projeto que não existe mais, e a
  // integração não consegue sobrescrevê-lo.
  //
  // Este bloco resolve o valor aqui (na compilação, no servidor) e o injeta no
  // pacote do navegador com um nome próprio. Assim o cliente de navegador usa
  // o mesmo endereço que o servidor, sem depender de apagar variável no painel.
  env: {
    NEXT_PUBLIC_SUPABASE_URL_EFETIVA:
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  },
};

module.exports = nextConfig;
