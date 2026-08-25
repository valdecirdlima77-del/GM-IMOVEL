-- =========================================================
-- GM NEGÓCIOS IMOBILIÁRIOS — Despesas e Repasses (Fase 2)
-- Depende de: supabase/aluguel-schema.sql
-- =========================================================
--
-- Aditivo puro: nenhuma tabela existente é alterada. Rode direto no
-- SQL Editor do Supabase, sem risco para os dados já cadastrados.

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type tipo_despesa as enum ('manutencao', 'reparo', 'taxa', 'iptu', 'condominio', 'outra');
create type pago_por_despesa as enum ('proprietario', 'inquilino', 'imobiliaria');
create type status_repasse as enum ('calculado', 'confirmado', 'pago');

-- ---------------------------------------------------------
-- DESPESAS (lançamentos avulsos de um imóvel alugado)
-- ---------------------------------------------------------
create table despesas (
    id                  uuid primary key default uuid_generate_v4(),
    imovel_alugado_id   uuid not null references imoveis_alugados(id) on delete cascade,
    tipo                tipo_despesa not null default 'outra',
    descricao           text not null,
    valor               numeric(12,2) not null check (valor >= 0),
    competencia         date not null,          -- primeiro dia do mês a que a despesa se refere
    pago_por            pago_por_despesa not null default 'proprietario',
    repassavel          boolean not null default true, -- entra no cálculo do repasse do proprietário?
    comprovante_url     text,
    observacoes         text,
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now()
);
create index idx_despesas_imovel_alugado on despesas(imovel_alugado_id);
create index idx_despesas_competencia on despesas(competencia);

-- ---------------------------------------------------------
-- REPASSES (fechamento mensal por proprietário)
-- ---------------------------------------------------------
create table repasses (
    id                      uuid primary key default uuid_generate_v4(),
    proprietario_id         uuid not null references proprietarios(id) on delete restrict,
    competencia             date not null,        -- primeiro dia do mês de referência
    valor_bruto             numeric(12,2) not null default 0, -- soma dos pagamentos recebidos no mês
    taxa_administracao      numeric(12,2) not null default 0, -- comissão aplicada (valor, não %)
    total_despesas          numeric(12,2) not null default 0, -- soma das despesas repassáveis
    valor_liquido           numeric(12,2) not null default 0, -- bruto - taxa - despesas
    status                  status_repasse not null default 'calculado',
    data_repasse            date,
    comprovante_url         text,
    demonstrativo_url       text,
    observacoes             text,
    criado_em               timestamptz not null default now(),
    atualizado_em           timestamptz not null default now(),
    unique (proprietario_id, competencia)
);
create index idx_repasses_proprietario on repasses(proprietario_id);
create index idx_repasses_competencia on repasses(competencia);
create index idx_repasses_status on repasses(status);

-- ---------------------------------------------------------
-- REPASSE_ITENS (detalhamento do que compôs o repasse — para o demonstrativo)
-- ---------------------------------------------------------
create type tipo_item_repasse as enum ('aluguel', 'multa', 'juros', 'despesa', 'taxa_administracao');
create type sinal_item_repasse as enum ('credito', 'debito');

create table repasse_itens (
    id                  uuid primary key default uuid_generate_v4(),
    repasse_id          uuid not null references repasses(id) on delete cascade,
    tipo                tipo_item_repasse not null,
    sinal               sinal_item_repasse not null,
    descricao           text not null,
    valor               numeric(12,2) not null check (valor >= 0),
    origem_id           uuid,   -- id do pagamento ou despesa de origem, quando aplicável
    criado_em           timestamptz not null default now()
);
create index idx_repasse_itens_repasse on repasse_itens(repasse_id);

-- trigger de atualizado_em, mesmo padrão das demais tabelas
create trigger trg_despesas_atualizado_em
    before update on despesas
    for each row execute function atualizar_timestamp_alteracao();

create trigger trg_repasses_atualizado_em
    before update on repasses
    for each row execute function atualizar_timestamp_alteracao();

-- =========================================================
-- RLS — aplicar junto com supabase/rls-administrativo.sql
-- =========================================================
-- Estas duas tabelas guardam a mesma classe de dado financeiro sensível das
-- 7 já cobertas por rls-administrativo.sql. Ligar o RLS aqui também, sem
-- política permissiva — acesso só via service_role no servidor:
--
--   alter table despesas enable row level security;
--   alter table repasses enable row level security;
--   alter table repasse_itens enable row level security;
--
-- Rollback, se algo quebrar:
--   alter table despesas disable row level security;
--   alter table repasses disable row level security;
--   alter table repasse_itens disable row level security;
