import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { alertarAdminGM } from "@/lib/notificacoes/whatsapp";
import { formatarData, formatarMoeda } from "@/lib/formatadores";

// Rota de cron (chame via Vercel Cron ou manualmente):
//  1. Marca cobranças vencidas como "atrasado".
//  2. Envia alerta no WhatsApp do admin para cobranças que vencem em 3 dias.
//
// Para agendar no Vercel, adicione em vercel.json:
// { "crons": [{ "path": "/api/cron/verificar-vencimentos", "schedule": "0 12 * * *" }] }
export async function GET() {
  const supabase = criarClienteSupabaseServidor();

  await supabase.rpc("marcar_cobrancas_atrasadas");

  const emTresDias = new Date();
  emTresDias.setDate(emTresDias.getDate() + 3);
  const dataAlvo = emTresDias.toISOString().slice(0, 10);

  const { data: cobrancas, error } = await supabase
    .from("cobrancas")
    .select(
      "id, valor_previsto, data_vencimento, alerta_enviado_em, imoveis_alugados(endereco_completo, inquilinos(nome))"
    )
    .eq("status", "pendente")
    .eq("data_vencimento", dataAlvo)
    .is("alerta_enviado_em", null);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const lista = cobrancas ?? [];

  for (const cobranca of lista as any[]) {
    const locacao = cobranca.imoveis_alugados;
    const mensagem =
      `Lembrete: aluguel de ${locacao?.endereco_completo ?? "imóvel"} ` +
      `(inquilino: ${locacao?.inquilinos?.nome ?? "-"}) vence em 3 dias, ` +
      `dia ${formatarData(cobranca.data_vencimento)}, valor ${formatarMoeda(cobranca.valor_previsto)}.`;

    await alertarAdminGM(mensagem);

    await supabase
      .from("cobrancas")
      .update({ alerta_enviado_em: new Date().toISOString() })
      .eq("id", cobranca.id);
  }

  return NextResponse.json({ ok: true, alertas_enviados: lista.length });
}
