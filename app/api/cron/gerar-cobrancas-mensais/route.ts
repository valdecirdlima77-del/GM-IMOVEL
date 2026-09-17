import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/auth/cron";

// Gera a cobrança do mês corrente para toda locação ativa que ainda não tem
// uma cobrança dessa competência.
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

  const { data: locacoes, error: erroLocacoes } = await supabase
    .from("imoveis_alugados")
    .select("id, valor_aluguel, dia_vencimento")
    .eq("status", "ativo");

  if (erroLocacoes) {
    return NextResponse.json({ erro: erroLocacoes.message }, { status: 500 });
  }

  const lista = locacoes ?? [];
  let criadas = 0;
  const erros: string[] = [];

  for (const locacao of lista) {
    const diaVencimento = locacao.dia_vencimento ?? 5;
    const mesFmt = String(hoje.getMonth() + 1).padStart(2, "0");
    const dataVencimento = `${hoje.getFullYear()}-${mesFmt}-${String(diaVencimento).padStart(2, "0")}`;

    // O unique (imovel_alugado_id, competencia) do schema garante que essa
    // chamada nunca duplica cobrança para a mesma locação/mês, mesmo se o
    // cron rodar mais de uma vez no período.
    const { error: erroInsercao } = await supabase.from("cobrancas").insert({
      imovel_alugado_id: locacao.id,
      competencia,
      data_vencimento: dataVencimento,
      valor_previsto: locacao.valor_aluguel,
      status: "pendente",
    });

    if (erroInsercao) {
      // Código 23505 = violação de unique constraint — a cobrança desse mês
      // já existia (cron rodou de novo, ou foi criada manualmente). Não é
      // erro de verdade, só pula.
      if (erroInsercao.code !== "23505") {
        erros.push(`${locacao.id}: ${erroInsercao.message}`);
      }
      continue;
    }

    criadas += 1;
  }

  return NextResponse.json({
    ok: true,
    competencia,
    locacoes_ativas: lista.length,
    cobrancas_criadas: criadas,
    erros,
  });
}
