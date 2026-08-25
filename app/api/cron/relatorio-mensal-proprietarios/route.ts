import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/auth/cron";
import { enviarEmail } from "@/lib/notificacoes/email";
import { enviarWhatsApp } from "@/lib/notificacoes/whatsapp";
import { formatarMoeda, competenciaLabel } from "@/lib/formatadores";
import { gerarRepasse } from "@/lib/repasses/calcular-repasse";

// Gera o repasse do mês (aplicando comissao_percentual e despesas
// repassáveis — ver lib/repasses/calcular-repasse.ts) e envia, para cada
// proprietário, um resumo com o valor líquido a receber. Chame manualmente
// ou agende no Vercel Cron:
// { "path": "/api/cron/relatorio-mensal-proprietarios", "schedule": "0 12 1 * *" }
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const supabase = criarClienteSupabaseAdmin();

  const competencia = new Date().toISOString().slice(0, 7) + "-01";

  const { data: proprietarios, error } = await supabase
    .from("proprietarios")
    .select("id, nome, email, telefone")
    .eq("ativo", true);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  let enviados = 0;

  for (const proprietario of proprietarios ?? []) {
    const { data: cobrancas } = await supabase
      .from("cobrancas")
      .select("valor_previsto, status, imoveis_alugados!inner(proprietario_id, endereco_completo)")
      .eq("competencia", competencia)
      .eq("imoveis_alugados.proprietario_id", proprietario.id);

    const linhas = (cobrancas ?? []) as any[];
    if (linhas.length === 0) continue;

    const resumo = linhas
      .map(
        (c) =>
          `${c.imoveis_alugados?.endereco_completo ?? "-"}: ${formatarMoeda(
            c.valor_previsto
          )} (${c.status})`
      )
      .join("\n");

    const repasse = await gerarRepasse(proprietario.id, competencia);
    const resumoRepasse =
      "erro" in repasse
        ? "Não foi possível calcular o repasse deste mês."
        : `Bruto: ${formatarMoeda(repasse.repasse.valor_bruto)} · ` +
          `Taxa de administração: ${formatarMoeda(repasse.repasse.taxa_administracao)} · ` +
          `Despesas: ${formatarMoeda(repasse.repasse.total_despesas)} · ` +
          `Valor líquido: ${formatarMoeda(repasse.repasse.valor_liquido)}`;

    const mensagem =
      `Relatório de ${competenciaLabel(competencia)} — GM Negócios Imobiliários.\n` +
      `${resumoRepasse}\n\nCobranças do mês:\n${resumo}`;

    if (proprietario.telefone) {
      await enviarWhatsApp(proprietario.telefone, mensagem);
    }
    if (proprietario.email) {
      await enviarEmail(
        proprietario.email,
        `Relatório de aluguéis — ${competenciaLabel(competencia)}`,
        `<pre>${mensagem}</pre>`
      );
    }
    enviados += 1;
  }

  return NextResponse.json({ ok: true, relatorios_enviados: enviados });
}
