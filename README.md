# CasaLar — Como rodar e publicar (sem gastar nada)

Este é o esqueleto inicial do site, já funcional: home, listagem de imóveis,
conectado ao Supabase. Falta cadastrar imóveis reais e ir completando as
próximas telas (detalhes do imóvel, agendamento, painéis) — mas já roda.

## 1. Rodar no seu computador (para testar)

1. Instale o [Node.js](https://nodejs.org) (versão 18 ou mais nova) — gratuito.
2. Abra uma pasta com este projeto e rode no terminal:
   ```
   npm install
   npm run dev
   ```
3. Abra `http://localhost:3000` no navegador.

Nesse ponto o site já abre, só que sem imóveis (porque o banco ainda não
está conectado). Isso é esperado.

## 2. Criar o banco de dados gratuito (Supabase)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) (sem cartão).
2. Crie um novo projeto (escolha uma senha de banco e guarde-a).
3. No painel do Supabase, vá em **SQL Editor** e cole o conteúdo do arquivo
   `database-schema.sql` (entregue junto com este projeto). Rode.
4. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public key`
5. No seu projeto, copie o arquivo `.env.example` para `.env.local` e cole
   esses dois valores.
6. Rode `npm run dev` de novo — a página já consegue conversar com o banco.

## 3. Cadastrar o primeiro imóvel (manual, direto no Supabase, por enquanto)

Enquanto o painel do corretor ainda não foi construído, você pode cadastrar
um imóvel de teste direto na aba **Table Editor** do Supabase, preenchendo
as tabelas `enderecos`, `corretores` e `imoveis` (nessa ordem, porque uma
depende da outra). Assim que o painel do corretor estiver pronto, isso passa
a ser feito por um formulário simples.

## 4. Publicar o site gratuitamente (Vercel)

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) (pode entrar
   com sua conta do GitHub).
2. Suba este projeto para um repositório no GitHub (gratuito).
3. Na Vercel, clique em **New Project**, escolha o repositório.
4. Em **Environment Variables**, adicione as mesmas duas variáveis do
   `.env.local` (URL e chave do Supabase).
5. Clique em **Deploy**.

Pronto — o site fica no ar em um endereço gratuito tipo
`casalar.vercel.app`, sem precisar comprar domínio nem cartão de crédito
em nenhuma etapa.

## O que já existe neste esqueleto
- Estrutura do projeto (Next.js + Tailwind com as cores/tipografia da marca)
- Conexão com Supabase (cliente e servidor)
- Página Home (com busca de imóveis em destaque)
- Página de listagem de imóveis
- Card de imóvel reutilizável
- Cabeçalho e rodapé

## Próximos passos sugeridos
1. Página de detalhes do imóvel (`/imoveis/[slug]`)
2. Formulário de agendamento de visita
3. Painel do corretor (cadastrar/editar imóveis com fotos)
4. Integração com WhatsApp
5. Assistente de IA no chat
