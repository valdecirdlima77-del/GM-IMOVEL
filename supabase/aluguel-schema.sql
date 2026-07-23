-- =========================================================
-- GM NEGÓCIOS IMOBILIÁRIOS — Módulo de Aluguéis
-- Schema complementar (PostgreSQL / Supabase)
-- Depende de: supabase/database-schema.sql (tabela imoveis, usuarios etc.)
-- =========================================================

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type status_cobranca as enum ('pendente', 'pago', 'atrasado', 'cancelado');
create type status_pagamento as enum ('confirmado', 'estornado', 'pendente');
create type status_locacao as enum ('ativo', 'encerrado', 'inadimplente', 'em_renovacao');
create type meio_notificacao as enum ('whatsapp', 'email');

-- ---------------------------------------------------------
-- PROPRIETARIOS (donos dos imóveis alugados via GM)
-- ---------------------------------------------------------
create table proprietarios (
    id                  uuid primary key default uuid_generate_v4(),
    nome                text not null,
    cpf_cnpj            text,
    email               text,
    telefone            text not null,
    banco               text,
    agencia             text,
    conta               text,
    tipo_conta          text,               -- 'corrente' | 'poupanca' | 'pix'
    chave_pix           text,
    comissao_percentual numeric(5,2) not null default 10.00,
    observacoes         text,
    ativo               boolean not null default true,
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now()
);
create index idx_proprietarios_nome_trgm on proprietarios using gin (nome gin_trgm_ops);
create index idx_proprietarios_ativo on proprietarios(ativo);

-- ---------------------------------------------------------
-- INQUILINOS (locatários)
-- ---------------------------------------------------------
create table inquilinos (
    id                  uuid primary key default uuid_generate_v4(),
    nome                text not null,
    cpf                 text,
    rg                  text,
    email               text,
    telefone            text not null,
    whatsapp            text,
    comprovante_renda_url text,
    renda_declarada     numeric(12,2),
    fiador_nome         text,
    fiador_telefone     text,
    observacoes         text,
    ativo               boolean not null default true,
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now()
);
create index idx_inquilinos_nome_trgm on inquilinos using gin (nome gin_trgm_ops);
create index idx_inquilinos_ativo on inquilinos(ativo);

-- ---------------------------------------------------------
-- IMOVEIS_ALUGADOS (ficha da locação — liga imóvel + proprietário + inquilino)
-- ---------------------------------------------------------
create table imoveis_alugados (
    id                  uuid primary key default uuid_generate_v4(),
    imovel_id           uuid references imoveis(id) on delete set null,
    proprietario_id     uuid not null references proprietarios(id) on delete restrict,
    inquilino_id        uuid references inquilinos(id) on delete set null,
    endereco_completo   text not null,       -- redundante e simples p/ listagem rápida
    valor_aluguel       numeric(12,2) not null,
    dia_vencimento      smallint not null default 5 check (dia_vencimento between 1 and 28),
    status              status_locacao not null default 'ativo',
    data_inicio         date not null default current_date,
    data_fim            date,
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now()
);
create index idx_imoveis_alugados_status on imoveis_alugados(status);
create index idx_imoveis_alugados_proprietario on imoveis_alugados(proprietario_id);
create index idx_imoveis_alugados_inquilino on imoveis_alugados(inquilino_id);

-- ---------------------------------------------------------
-- CONTRATOS_ALUGUEL
-- ---------------------------------------------------------
create table contratos_aluguel (
    id                  uuid primary key default uuid_generate_v4(),
    imovel_alugado_id   uuid not null references imoveis_alugados(id) on delete cascade,
    numero_contrato     text unique,
    data_assinatura     date,
    data_inicio         date not null,
    data_fim            date,
    valor_aluguel       numeric(12,2) not null,
    valor_condominio    numeric(10,2),
    valor_iptu          numeric(10,2),
    dia_vencimento      smallint not null default 5 check (dia_vencimento between 1 and 28),
    indice_reajuste     text default 'IGPM',
    multa_atraso_percentual numeric(5,2) default 2.00,
    juros_mora_percentual_dia numeric(5,4) default 0.0333,
    clausulas_extra     text,
    documento_url       text,
    status              status_contrato not null default 'em_negociacao',
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now()
);
create index idx_contratos_aluguel_imovel_alugado on contratos_aluguel(imovel_alugado_id);
create index idx_contratos_aluguel_status on contratos_aluguel(status);

-- ---------------------------------------------------------
-- COBRANCAS (agenda mensal de cobrança — 1 linha por mês/locação)
-- ---------------------------------------------------------
create table cobrancas (
    id                  uuid primary key default uuid_generate_v4(),
    imovel_alugado_id   uuid not null references imoveis_alugados(id) on delete cascade,
    contrato_id         uuid references contratos_aluguel(id) on delete set null,
    competencia         date not null,        -- primeiro dia do mês de referência
    data_vencimento     date not null,
    valor_previsto      numeric(12,2) not null,
    status              status_cobranca not null default 'pendente',
    alerta_enviado_em   timestamptz,           -- controla o alerta "vence em 3 dias"
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now(),
    unique (imovel_alugado_id, competencia)
);
create index idx_cobrancas_status on cobrancas(status);
create index idx_cobrancas_vencimento on cobrancas(data_vencimento);
create index idx_cobrancas_imovel_alugado on cobrancas(imovel_alugado_id);

-- ---------------------------------------------------------
-- PAGAMENTOS (baixa efetiva de uma cobrança, pode haver estornos)
-- ---------------------------------------------------------
create table pagamentos (
    id                  uuid primary key default uuid_generate_v4(),
    cobranca_id         uuid not null references cobrancas(id) on delete cascade,
    valor_pago          numeric(12,2) not null,
    data_pagamento      date not null default current_date,
    forma_pagamento     text,                  -- 'pix' | 'boleto' | 'dinheiro' | 'cartao' | 'transferencia'
    referencia_externa  text,                  -- id da transação no gateway (Stripe/MercadoPago)
    status              status_pagamento not null default 'confirmado',
    observacoes         text,
    registrado_por      uuid references usuarios(id) on delete set null,
    criado_em           timestamptz not null default now()
);
create index idx_pagamentos_cobranca on pagamentos(cobranca_id);
create index idx_pagamentos_data on pagamentos(data_pagamento);

-- ---------------------------------------------------------
-- RECIBOS (documento gerado após confirmação de pagamento)
-- ---------------------------------------------------------
create table recibos (
    id                  uuid primary key default uuid_generate_v4(),
    pagamento_id        uuid not null references pagamentos(id) on delete cascade,
    numero_recibo       text unique not null,
    pdf_url             text,
    enviado_inquilino_em    timestamptz,
    enviado_proprietario_em timestamptz,
    ultimo_meio_envio   meio_notificacao,
    criado_em           timestamptz not null default now()
);
create index idx_recibos_pagamento on recibos(pagamento_id);

-- ---------------------------------------------------------
-- Trigger utilitário: atualizado_em automático
-- ---------------------------------------------------------
create or replace function atualizar_timestamp_alteracao()
returns trigger as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_proprietarios_atualizado before update on proprietarios
    for each row execute function atualizar_timestamp_alteracao();
create trigger trg_inquilinos_atualizado before update on inquilinos
    for each row execute function atualizar_timestamp_alteracao();
create trigger trg_imoveis_alugados_atualizado before update on imoveis_alugados
    for each row execute function atualizar_timestamp_alteracao();
create trigger trg_contratos_aluguel_atualizado before update on contratos_aluguel
    for each row execute function atualizar_timestamp_alteracao();
create trigger trg_cobrancas_atualizado before update on cobrancas
    for each row execute function atualizar_timestamp_alteracao();

-- ---------------------------------------------------------
-- Trigger: quando um pagamento é confirmado, marca a cobrança como paga
-- ---------------------------------------------------------
create or replace function marcar_cobranca_paga()
returns trigger as $$
begin
    if new.status = 'confirmado' then
        update cobrancas
            set status = 'pago', atualizado_em = now()
            where id = new.cobranca_id;
    elsif new.status = 'estornado' then
        update cobrancas
            set status = 'pendente', atualizado_em = now()
            where id = new.cobranca_id;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trg_pagamento_marca_cobranca
    after insert or update on pagamentos
    for each row execute function marcar_cobranca_paga();

-- ---------------------------------------------------------
-- Função utilitária: marcar cobrancas vencidas como 'atrasado'
-- (chamada pela rota /api/cron/verificar-vencimentos)
-- ---------------------------------------------------------
create or replace function marcar_cobrancas_atrasadas()
returns void as $$
begin
    update cobrancas
        set status = 'atrasado', atualizado_em = now()
        where status = 'pendente'
          and data_vencimento < current_date;
end;
$$ language plpgsql;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table proprietarios enable row level security;
alter table inquilinos enable row level security;
alter table imoveis_alugados enable row level security;
alter table contratos_aluguel enable row level security;
alter table cobrancas enable row level security;
alter table pagamentos enable row level security;
alter table recibos enable row level security;

create policy "Admin gerencia proprietarios"
    on proprietarios for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));

create policy "Admin gerencia inquilinos"
    on inquilinos for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));

create policy "Admin gerencia imoveis_alugados"
    on imoveis_alugados for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));

create policy "Admin gerencia contratos_aluguel"
    on contratos_aluguel for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));

create policy "Admin gerencia cobrancas"
    on cobrancas for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));

create policy "Admin gerencia pagamentos"
    on pagamentos for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));

create policy "Admin gerencia recibos"
    on recibos for all
    using (exists (select 1 from usuarios where auth_id = auth.uid() and papel = 'admin'));
