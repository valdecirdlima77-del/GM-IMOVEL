import { NextResponse } from "next/server";

const SQL_SETUP = `
-- ENUMs
do $$ begin
  create type status_cobranca as enum ('pendente', 'pago', 'atrasado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_pagamento as enum ('confirmado', 'estornado', 'pendente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_locacao as enum ('ativo', 'encerrado', 'inadimplente', 'em_renovacao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_contrato as enum ('em_negociacao', 'ativo', 'encerrado', 'rescindido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meio_notificacao as enum ('whatsapp', 'email');
exception when duplicate_object then null; end $$;

-- PROPRIETARIOS
create table if not exists proprietarios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cpf_cnpj text,
  email text,
  telefone text not null,
  banco text, agencia text, conta text, tipo_conta text, chave_pix text,
  comissao_percentual numeric(5,2) not null default 10.00,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- INQUILINOS
create table if not exists inquilinos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cpf text, rg text,
  email text,
  telefone text not null,
  whatsapp text,
  comprovante_renda_url text,
  renda_declarada numeric(12,2),
  fiador_nome text, fiador_telefone text,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- IMOVEIS_ALUGADOS
create table if not exists imoveis_alugados (
  id uuid primary key default uuid_generate_v4(),
  imovel_id uuid references imoveis(id) on delete set null,
  proprietario_id uuid not null references proprietarios(id) on delete restrict,
  inquilino_id uuid references inquilinos(id) on delete set null,
  endereco_completo text not null,
  valor_aluguel numeric(12,2) not null,
  dia_vencimento smallint not null default 5 check (dia_vencimento between 1 and 28),
  status status_locacao not null default 'ativo',
  data_inicio date not null default current_date,
  data_fim date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- CONTRATOS
create table if not exists contratos_aluguel (
  id uuid primary key default uuid_generate_v4(),
  imovel_alugado_id uuid not null references imoveis_alugados(id) on delete cascade,
  numero_contrato text unique,
  data_assinatura date,
  data_inicio date not null,
  data_fim date,
  valor_aluguel numeric(12,2) not null,
  valor_condominio numeric(10,2),
  valor_iptu numeric(10,2),
  dia_vencimento smallint not null default 5 check (dia_vencimento between 1 and 28),
  indice_reajuste text default 'IGPM',
  multa_atraso_percentual numeric(5,2) default 2.00,
  juros_mora_percentual_dia numeric(5,4) default 0.0333,
  clausulas_extra text,
  documento_url text,
  status status_contrato not null default 'em_negociacao',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- COBRANCAS
create table if not exists cobrancas (
  id uuid primary key default uuid_generate_v4(),
  imovel_alugado_id uuid not null references imoveis_alugados(id) on delete cascade,
  contrato_id uuid references contratos_aluguel(id) on delete set null,
  competencia date not null,
  data_vencimento date not null,
  valor_previsto numeric(12,2) not null,
  status status_cobranca not null default 'pendente',
  alerta_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (imovel_alugado_id, competencia)
);

-- PAGAMENTOS
create table if not exists pagamentos (
  id uuid primary key default uuid_generate_v4(),
  cobranca_id uuid not null references cobrancas(id) on delete cascade,
  valor_pago numeric(12,2) not null,
  data_pagamento date not null default current_date,
  forma_pagamento text,
  referencia_externa text,
  status status_pagamento not null default 'confirmado',
  observacoes text,
  registrado_por uuid,
  criado_em timestamptz not null default now()
);

-- RECIBOS
create table if not exists recibos (
  id uuid primary key default uuid_generate_v4(),
  pagamento_id uuid not null references pagamentos(id) on delete cascade,
  numero_recibo text unique not null,
  pdf_url text,
  enviado_inquilino_em timestamptz,
  enviado_proprietario_em timestamptz,
  ultimo_meio_envio meio_notificacao,
  criado_em timestamptz not null default now()
);

-- TRIGGER atualizado_em
create or replace function atualizar_timestamp_alteracao()
returns trigger as $$
begin new.atualizado_em = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_proprietarios_atualizado on proprietarios;
create trigger trg_proprietarios_atualizado before update on proprietarios for each row execute function atualizar_timestamp_alteracao();

drop trigger if exists trg_inquilinos_atualizado on inquilinos;
create trigger trg_inquilinos_atualizado before update on inquilinos for each row execute function atualizar_timestamp_alteracao();

drop trigger if exists trg_imoveis_alugados_atualizado on imoveis_alugados;
create trigger trg_imoveis_alugados_atualizado before update on imoveis_alugados for each row execute function atualizar_timestamp_alteracao();

drop trigger if exists trg_cobrancas_atualizado on cobrancas;
create trigger trg_cobrancas_atualizado before update on cobrancas for each row execute function atualizar_timestamp_alteracao();

-- TRIGGER pagamento -> cobrança paga
create or replace function marcar_cobranca_paga()
returns trigger as $$
begin
  if new.status = 'confirmado' then
    update cobrancas set status = 'pago', atualizado_em = now() where id = new.cobranca_id;
  elsif new.status = 'estornado' then
    update cobrancas set status = 'pendente', atualizado_em = now() where id = new.cobranca_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pagamento_marca_cobranca on pagamentos;
create trigger trg_pagamento_marca_cobranca after insert or update on pagamentos for each row execute function marcar_cobranca_paga();

-- FUNÇÃO marcar atrasadas
create or replace function marcar_cobrancas_atrasadas()
returns void as $$
begin
  update cobrancas set status = 'atrasado', atualizado_em = now()
  where status = 'pendente' and data_vencimento < current_date;
end;
$$ language plpgsql;

-- RLS desativado para uso interno (sem auth Supabase)
alter table proprietarios disable row level security;
alter table inquilinos disable row level security;
alter table imoveis_alugados disable row level security;
alter table contratos_aluguel disable row level security;
alter table cobrancas disable row level security;
alter table pagamentos disable row level security;
alter table recibos disable row level security;
`;

export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { erro: "SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel." },
      { status: 500 }
    );
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: SQL_SETUP }),
  });

  // Supabase não tem rpc/exec_sql nativo — usa pg via Management API
  const mgRes = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseUrl.split(".")[0].replace("https://", "")}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: SQL_SETUP }),
    }
  );

  if (!mgRes.ok) {
    const err = await mgRes.text();
    return NextResponse.json({ erro: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mensagem: "Banco configurado com sucesso!" });
}
