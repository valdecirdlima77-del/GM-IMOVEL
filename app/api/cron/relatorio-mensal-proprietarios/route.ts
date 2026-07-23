import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { enviarEmail } from "@/lib/notificacoes/email";
import { enviarWhatsApp } from "@/lib/notificacoes/whatsapp";
import { formatarMoeda, competenciaLabel } from "@/lib/formatadores";

// Envia, uma vez por mês, um resumo do que cada proprietário recebeu de
// aluguel no mês corrente. Chame manualmente ou agende no Vercel Cron:
// { "path": "/api/cron/relatorio-mensal-proprietarios", "schedule": "0 12 1 * *" }
export async function GET() {
  const supabase = criarClienteSupabaseServidor();

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

    const total = linhas
      .filter((c) => c.status === "pago")
      .reduce((soma, c) => soma + Number(c.valor_previsto), 0);

    const resumo = linhas
      .map(
        (c) =>
          `${c.imoveis_alugados?.endereco_completo ?? "-"}: ${formatarMoeda(
            c.valor_previsto
          )} (${c.status})`
      )
      .join("\n");

    const mensagem =
      `Relatório de ${competenciaLabel(competencia)} — GM Negócios Imobiliários.\n` +
      `Total recebido: ${formatarMoeda(total)}.\n${resumo}`;

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
