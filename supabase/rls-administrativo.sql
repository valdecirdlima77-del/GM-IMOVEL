-- =========================================================
-- LIGAR O ROW LEVEL SECURITY NAS TABELAS DO ADMINISTRATIVO
-- =========================================================
--
-- NÃO EXECUTE ESTE ARQUIVO SEM LER O QUE ESTÁ ESCRITO AQUI.
--
-- Contexto
-- --------
-- O Security Advisor do Supabase aponta 7 tabelas com "RLS Disabled in Public".
-- São justamente as que guardam CPF, RG, renda declarada, contratos e
-- movimentação financeira. Sem RLS, qualquer portador da chave pública
-- (`anon`/`publishable`) lê tudo — e essa chave vai dentro do JavaScript do
-- site, acessível a qualquer visitante.
--
-- Elas foram desligadas pela rota /api/admin/setup, com a justificativa de que
-- o painel não usa Supabase Auth e o RLS bloquearia o acesso. Isso era
-- verdade na época.
--
-- Por que agora é seguro ligar
-- ----------------------------
-- Desde 25/08/2026, TODAS as rotas de API do administrativo usam a chave
-- privilegiada (`service_role`) e verificam o cookie de sessão antes de
-- responder. A chave privilegiada ignora RLS por natureza — então o painel
-- continua funcionando com o RLS ligado. O que deixa de funcionar é o acesso
-- direto de fora com a chave pública, que é exatamente o que queremos impedir.
--
-- Estado da preparação (25/08/2026)
-- ---------------------------------
-- [x] Rotas de API do administrativo: usam service_role + verificam sessão
-- [x] As 15 telas de app/admin/*: convertidas para service_role
-- [x] Telas públicas (/, /imoveis, /imoveis/[slug]): seguem com a chave
--     pública de propósito — leem só imóveis publicados e suas fotos, que é
--     informação pública por natureza
--
-- Ou seja: nada no painel depende mais da chave pública para ler estas 7
-- tabelas. Aplicar este script não deve esvaziar tela nenhuma.
--
-- Mesmo assim: aplique e confira o painel logo em seguida. Se algo sumir, o
-- rollback está no fim deste arquivo.
--
-- O que este script faz
-- ---------------------
-- Liga o RLS SEM criar políticas permissivas. Ou seja: ninguém acessa com a
-- chave pública. O acesso legítimo acontece só pela chave privilegiada, usada
-- exclusivamente no servidor.
--
-- Não criamos políticas baseadas em auth.uid() porque este painel não usa
-- Supabase Auth — políticas assim seriam sempre falsas e dariam a impressão
-- errada de que existe controle por usuário.

alter table proprietarios       enable row level security;
alter table inquilinos          enable row level security;
alter table imoveis_alugados    enable row level security;
alter table contratos_aluguel   enable row level security;
alter table cobrancas           enable row level security;
alter table pagamentos          enable row level security;
alter table recibos             enable row level security;

-- A tabela `fotos` também está sem RLS, mas de propósito: o site público
-- precisa ler as fotos dos imóveis publicados. Deixar como está.

-- =========================================================
-- COMO CONFERIR SE FUNCIONOU
-- =========================================================
-- Depois de aplicar, com a chave pública (anon), isto deve retornar VAZIO:
--
--   curl "https://SEU-PROJETO.supabase.co/rest/v1/inquilinos?select=id" \
--        -H "apikey: CHAVE_ANON"
--
-- E o painel administrativo deve continuar listando normalmente.
-- Se o painel esvaziar, é o ponto 1 do aviso acima.

-- =========================================================
-- ROLLBACK  (se o painel quebrar)
-- =========================================================
-- alter table proprietarios     disable row level security;
-- alter table inquilinos        disable row level security;
-- alter table imoveis_alugados  disable row level security;
-- alter table contratos_aluguel disable row level security;
-- alter table cobrancas         disable row level security;
-- alter table pagamentos        disable row level security;
-- alter table recibos           disable row level security;
