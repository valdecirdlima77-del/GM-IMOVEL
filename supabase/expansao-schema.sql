-- =========================================================
-- GM NEGÓCIOS IMOBILIÁRIOS — Módulo de Expansão
-- Schema complementar (PostgreSQL / Supabase)
-- Depende de: aluguel-schema.sql (imoveis_alugados, proprietarios,
--             processos_juridicos, formularios etc.)
--
-- SOMENTE comandos aditivos (CREATE TABLE IF NOT EXISTS).
-- Nenhum DROP. As 21 tabelas existentes ficam intactas.
-- =========================================================

-- 1. repasses
CREATE TABLE IF NOT EXISTS repasses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_alugado_id UUID NOT NULL REFERENCES imoveis_alugados(id),
  proprietario_id UUID NOT NULL REFERENCES proprietarios(id),
  competencia DATE NOT NULL,
  valor_aluguel NUMERIC(10,2) NOT NULL,
  taxa_administracao NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_repasse NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. clientes_unificados
CREATE TABLE IF NOT EXISTS clientes_unificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('inquilino','proprietario','cliente_advocacia','lead')),
  origem_id UUID,
  origem_tabela TEXT,
  notas TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. processos_juridicos
CREATE TABLE IF NOT EXISTS processos_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT,
  cliente_id UUID REFERENCES clientes_unificados(id),
  tipo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','encerrado','suspenso','arquivado')),
  vara TEXT,
  comarca TEXT,
  data_distribuicao DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. prazos_processuais
CREATE TABLE IF NOT EXISTS prazos_processuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  data_prazo DATE NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT false,
  data_conclusao DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. honorarios_juridicos
CREATE TABLE IF NOT EXISTS honorarios_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES processos_juridicos(id),
  cliente_id UUID REFERENCES clientes_unificados(id),
  descricao TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','parcial','quitado','cancelado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. parcelas_honorarios
CREATE TABLE IF NOT EXISTS parcelas_honorarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  honorario_id UUID NOT NULL REFERENCES honorarios_juridicos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. receitas
CREATE TABLE IF NOT EXISTS receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_receita DATE NOT NULL,
  categoria TEXT,
  cliente_id UUID REFERENCES clientes_unificados(id),
  comprovante_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. despesas
CREATE TABLE IF NOT EXISTS despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_despesa DATE NOT NULL,
  categoria TEXT,
  comprovante_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. formularios
CREATE TABLE IF NOT EXISTS formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  campos JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN NOT NULL DEFAULT true,
  slug TEXT UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. respostas_formularios
CREATE TABLE IF NOT EXISTS respostas_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id),
  dados JSONB NOT NULL DEFAULT '{}',
  ip_origem TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE repasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_unificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_juridicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazos_processuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE honorarios_juridicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas_honorarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_formularios ENABLE ROW LEVEL SECURITY;

-- Policies: bloqueiam acesso anônimo; service_role bypassa RLS implicitamente
CREATE POLICY "Sem acesso anonimo" ON repasses FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON clientes_unificados FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON processos_juridicos FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON prazos_processuais FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON honorarios_juridicos FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON parcelas_honorarios FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON receitas FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON despesas FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON formularios FOR ALL TO anon USING (false);
CREATE POLICY "Sem acesso anonimo" ON respostas_formularios FOR ALL TO anon USING (false);
