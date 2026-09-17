import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/auth/cron";

// Gera a cobrança do mês corrente para toda locação não encerrada (ativa,
// inadimplente ou em renovação) que ainda não tem uma cobrança dessa
// competência.
//
// Sem esta rota, só a PRIMEIRA cobrança de cada locação existia (criada no
// momento do cadastro em /api/imoveis-alugados) — a partir do 2º mês, nada
// cobrava o inquilino automaticamente. Ver docs/RISCOS_CRITICOS.md, P0-3.
//
// Para agendar no Vercel, adicione em vercel.json:
// { "crons": [{ "path": "/api/cron/gerar-cobrancas-mensais", "schedule": "0 6 1 * *" }] }
// (dia 1 de cada mês, 06:00 UTC — 03:00 em Mato Grosso do Sul)
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const supabase = criarClienteSupabaseAdmin();

  const hoje = new Date();
  const competencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;

  // Exclui só quem já encerrou. Uma locação `inadimplente` continua sendo
  // cobrada todo mês — parar de gerar cobrança pra quem está em atraso
  // faria a dívida parar de crescer no sistema, o oposto do que essa rota
  // existe para evitar (ver P0-3 acima).
  const { data: locacoes, error: erroLocacoes } = await supabase
    .from("imoveis_alugados")
    .select("id, valor_aluguel, dia_vencimento")
    .neq("status", "encerrado");

  if (erroLocacoes) {
    return NextResponse.json({ erro: erroLocacoes.message }, { status: 500 });
  }

  const lista = locacoes ?? [];
  const mesFmt = String(hoje.getMonth() + 1).padStart(2, "0");

  const linhas = lista.map((locacao) => {
    const diaVencimento = locacao.dia_vencimento ?? 5;
    return {
      imovel_alugado_id: locacao.id,
      competencia,
      data_vencimento: `${hoje.getFullYear()}-${mesFmt}-${String(diaVencimento).padStart(2, "0")}`,
      valor_previsto: locacao.valor_aluguel,
      status: "pendente" as const,
    };
  });

  if (linhas.length === 0) {
    return NextResponse.json({
      ok: true,
      competencia,
      locacoes_consideradas: 0,
      cobrancas_criadas: 0,
    });
  }

  // upsert com ignoreDuplicates: o unique (imovel_alugado_id, competencia)
  // do schema faz esta chamada pular, em lote, qualquer locação que já
  // tenha cobrança dessa competência — nunca duplica, mesmo se o cron
  // rodar mais de uma vez no período. Uma única ida ao banco em vez de uma
  // por locação.
  const { data: criadas, error: erroInsercao } = await supabase
    .from("cobrancas")
    .upsert(linhas, {
      onConflict: "imovel_alugado_id,competencia",
      ignoreDuplicates: true,
    })
    .select("id");

  if (erroInsercao) {
    return NextResponse.json({ erro: erroInsercao.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    competencia,
    locacoes_consideradas: lista.length,
    cobrancas_criadas: criadas?.length ?? 0,
  });
}
