-- =========================================================
-- CASALAR — Schema completo do banco de dados (PostgreSQL / Supabase)
-- =========================================================

-- Extensões úteis (gratuitas, já inclusas no Supabase)
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type papel_usuario as enum ('cliente', 'corretor', 'admin');
create type tipo_imovel as enum ('casa', 'apartamento', 'terreno', 'comercial', 'rural');
create type finalidade_imovel as enum ('venda', 'aluguel');
create type status_imovel as enum ('rascunho', 'em_analise', 'publicado', 'pausado', 'vendido', 'alugado');
create type status_agendamento as enum ('solicitado', 'confirmado', 'realizado', 'cancelado', 'remarcado');
create type origem_mensagem as enum ('whatsapp', 'chat_site', 'ia');
create type status_contrato as enum ('em_negociacao', 'assinado', 'concluido', 'cancelado');

-- ---------------------------------------------------------
-- USUARIOS (base para todos os papéis)
-- ---------------------------------------------------------
create table usuarios (
    id              uuid primary key default uuid_generate_v4(),
    auth_id         uuid unique,                     -- referência ao auth.users do Supabase
    nome            text not null,
    email           text unique,
    whatsapp        text,
    papel           papel_usuario not null default 'cliente',
    ativo           boolean not null default true,
    criado_em       timestamptz not null default now(),
    atualizado_em   timestamptz not null default now()
);
create index idx_usuarios_papel on usuarios(papel);

-- ---------------------------------------------------------
-- CLIENTES (dados extras de quem visita/agenda)
-- ---------------------------------------------------------
create table clientes (
    id              uuid primary key default uuid_generate_v4(),
    usuario_id      uuid not null references usuarios(id) on delete cascade,
    preferencias    jsonb,                            -- filtros salvos (bairro, faixa de preço etc.)
    criado_em       timestamptz not null default now(),
    unique (usuario_id)
);

-- ---------------------------------------------------------
-- CORRETORES
-- ---------------------------------------------------------
create table corretores (
    id              uuid primary key default uuid_generate_v4(),
    usuario_id      uuid not null references usuarios(id) on delete cascade,
    creci           text,
    bairros_atuacao text[],
    foto_url        text,
    biografia       text,
    comissao_padrao numeric(5,2) default 0,           -- percentual
    criado_em       timestamptz not null default now(),
    unique (usuario_id)
);

-- ---------------------------------------------------------
-- ENDERECOS
-- ---------------------------------------------------------
create table enderecos (
    id              uuid primary key default uuid_generate_v4(),
    logradouro      text not null,
    numero          text,
    complemento     text,
    bairro          text not null,
    cidade          text not null,
    estado          char(2) not null,
    cep             text,
    latitude        numeric(10,7),
    longitude       numeric(10,7),
    criado_em       timestamptz not null default now()
);
create index idx_enderecos_cidade_bairro on enderecos(cidade, bairro);
create index idx_enderecos_geo on enderecos(latitude, longitude);

-- ---------------------------------------------------------
-- IMOVEIS
-- ---------------------------------------------------------
create table imoveis (
    id              uuid primary key default uuid_generate_v4(),
    corretor_id     uuid not null references corretores(id) on delete restrict,
    endereco_id     uuid not null references enderecos(id) on delete restrict,
    titulo          text not null,
    slug            text unique not null,
    descricao       text,
    tipo            tipo_imovel not null,
    finalidade      finalidade_imovel not null,
    status          status_imovel not null default 'rascunho',
    preco           numeric(12,2) not null,
    condominio      numeric(10,2),
    iptu            numeric(10,2),
    area_util       numeric(8,2),
    quartos         smallint default 0,
    banheiros       smallint default 0,
    vagas_garagem   smallint default 0,
    visualizacoes   integer not null default 0,
    criado_em       timestamptz not null default now(),
    atualizado_em   timestamptz not null default now()
);
create index idx_imoveis_status on imoveis(status);
create index idx_imoveis_finalidade_tipo on imoveis(finalidade, tipo);
create index idx_imoveis_preco on imoveis(preco);
create index idx_imoveis_corretor on imoveis(corretor_id);
create index idx_imoveis_titulo_trgm on imoveis using gin (titulo gin_trgm_ops);

-- ---------------------------------------------------------
-- FOTOS
-- ---------------------------------------------------------
create table fotos (
    id              uuid primary key default uuid_generate_v4(),
    imovel_id       uuid not null references imoveis(id) on delete cascade,
    url             text not null,
    ordem           smallint not null default 0,
    principal       boolean not null default false,
    criado_em       timestamptz not null default now()
);
create index idx_fotos_imovel on fotos(imovel_id);

-- ---------------------------------------------------------
-- VIDEOS
-- ---------------------------------------------------------
create table videos (
    id              uuid primary key default uuid_generate_v4(),
    imovel_id       uuid not null references imoveis(id) on delete cascade,
    url             text not null,
    titulo          text,
    criado_em       timestamptz not null default now()
);
create index idx_videos_imovel on videos(imovel_id);

-- ---------------------------------------------------------
-- FAVORITOS
-- ---------------------------------------------------------
create table favoritos (
    id              uuid primary key default uuid_generate_v4(),
    cliente_id      uuid not null references clientes(id) on delete cascade,
    imovel_id       uuid not null references imoveis(id) on delete cascade,
    criado_em       timestamptz not null default now(),
    unique (cliente_id, imovel_id)
);
create index idx_favoritos_cliente on favoritos(cliente_id);

-- ---------------------------------------------------------
-- AGENDAMENTOS
-- ---------------------------------------------------------
create table agendamentos (
    id              uuid primary key default uuid_generate_v4(),
    imovel_id       uuid not null references imoveis(id) on delete cascade,
    cliente_id      uuid not null references clientes(id) on delete cascade,
    corretor_id     uuid not null references corretores(id) on delete restrict,
    data_hora       timestamptz not null,
    status          status_agendamento not null default 'solicitado',
    observacoes     text,
    criado_em       timestamptz not null default now(),
    atualizado_em   timestamptz not null default now()
);
create index idx_agendamentos_corretor_data on agendamentos(corretor_id, data_hora);
create index idx_agendamentos_cliente on agendamentos(cliente_id);
create unique index idx_agendamentos_sem_conflito
    on agendamentos(corretor_id, data_hora)
    where status in ('solicitado', 'confirmado');

-- ---------------------------------------------------------
-- HISTORICO_VISITAS
-- ---------------------------------------------------------
create table historico_visitas (
    id              uuid primary key default uuid_generate_v4(),
    agendamento_id  uuid not null references agendamentos(id) on delete cascade,
    resultado       text,                             -- ex: "interessado", "sem interesse", "vai pensar"
    feedback_cliente text,
    feedback_corretor text,
    registrado_em   timestamptz not null default now()
);
create index idx_historico_agendamento on historico_visitas(agendamento_id);

-- ---------------------------------------------------------
-- MENSAGENS (chat / whatsapp / ia)
-- ---------------------------------------------------------
create table mensagens (
    id              uuid primary key default uuid_generate_v4(),
    cliente_id      uuid references clientes(id) on delete set null,
    corretor_id     uuid references corretores(id) on delete set null,
    imovel_id       uuid references imoveis(id) on delete set null,
    origem          origem_mensagem not null,
    remetente       text not null,                    -- 'cliente' | 'corretor' | 'ia'
    conteudo        text not null,
    criado_em       timestamptz not null default now()
);
create index idx_mensagens_cliente on mensagens(cliente_id);
create index idx_mensagens_corretor on mensagens(corretor_id);

-- ---------------------------------------------------------
-- NOTIFICACOES
-- ---------------------------------------------------------
create table notificacoes (
    id              uuid primary key default uuid_generate_v4(),
    usuario_id      uuid not null references usuarios(id) on delete cascade,
    titulo          text not null,
    mensagem        text not null,
    lida            boolean not null default false,
    criado_em       timestamptz not null default now()
);
create index idx_notificacoes_usuario on notificacoes(usuario_id, lida);

-- ---------------------------------------------------------
-- CONTRATOS
-- ---------------------------------------------------------
create table contratos (
    id              uuid primary key default uuid_generate_v4(),
    imovel_id       uuid not null references imoveis(id) on delete restrict,
    cliente_id      uuid not null references clientes(id) on delete restrict,
    corretor_id     uuid not null references corretores(id) on delete restrict,
    valor_final     numeric(12,2) not null,
    comissao_valor  numeric(12,2),
    status          status_contrato not null default 'em_negociacao',
    criado_em       timestamptz not null default now(),
    atualizado_em   timestamptz not null default now()
);
create index idx_contratos_imovel on contratos(imovel_id);
create index idx_contratos_corretor on contratos(corretor_id);

-- ---------------------------------------------------------
-- DOCUMENTOS
-- ---------------------------------------------------------
create table documentos (
    id              uuid primary key default uuid_generate_v4(),
    contrato_id     uuid references contratos(id) on delete cascade,
    imovel_id       uuid references imoveis(id) on delete cascade,
    nome            text not null,
    url             text not null,
    tipo            text,                              -- ex: 'contrato', 'matricula', 'rg'
    criado_em       timestamptz not null default now()
);
create index idx_documentos_contrato on documentos(contrato_id);
create index idx_documentos_imovel on documentos(imovel_id);

-- =========================================================
-- ROW LEVEL SECURITY (exemplo de políticas essenciais)
-- =========================================================
alter table imoveis enable row level security;

create policy "Qualquer pessoa pode ver imoveis publicados"
    on imoveis for select
    using (status = 'publicado');

create policy "Corretor gerencia apenas os proprios imoveis"
    on imoveis for all
    using (
        corretor_id in (
            select id from corretores where usuario_id = (
                select id from usuarios where auth_id = auth.uid()
            )
        )
    );

create policy "Admin gerencia todos os imoveis"
    on imoveis for all
    using (
        exists (
            select 1 from usuarios
            where auth_id = auth.uid() and papel = 'admin'
        )
    );

alter table favoritos enable row level security;
create policy "Cliente gerencia apenas os proprios favoritos"
    on favoritos for all
    using (
        cliente_id in (
            select id from clientes where usuario_id = (
                select id from usuarios where auth_id = auth.uid()
            )
        )
    );

alter table agendamentos enable row level security;
create policy "Cliente ve os proprios agendamentos"
    on agendamentos for select
    using (
        cliente_id in (
            select id from clientes where usuario_id = (
                select id from usuarios where auth_id = auth.uid()
            )
        )
    );
create policy "Corretor ve os agendamentos da sua carteira"
    on agendamentos for select
    using (
        corretor_id in (
            select id from corretores where usuario_id = (
                select id from usuarios where auth_id = auth.uid()
            )
        )
    );
