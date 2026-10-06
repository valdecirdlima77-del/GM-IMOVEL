import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/auth/cron";
import { alertarAdminGM } from "@/lib/notificacoes/whatsapp";
import { formatarData } from "@/lib/formatadores";
import { prazosQueExigemAtencao, situacaoPrazo } from "@/lib/juridico/prazos";
import { hojeNoEscritorio } from "@/lib/datas";

// Alerta diário dos prazos processuais que vencem em até 5 dias ou já
// venceram e ainda não foram cumpridos. Agendado às 8h de Brasília (11h UTC):
// { "path": "/api/cron/verificar-prazos", "schedule": "0 11 * * *" }
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const hoje = hojeNoEscritorio();
  const supabase = criarClienteSupabaseAdmin();

  const { data: prazos, error } = await supabase
    .from("prazos_processuais")
    .select("id, descricao, data_prazo, concluido, processos_juridicos(numero_processo, tipo)")
    .eq("concluido", false)
    .order("data_prazo", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível consultar os prazos." }, { status: 500 });
  }

  const lista = (prazos ?? []) as unknown as {
    id: string;
    descricao: string;
    data_prazo: string;
    concluido: boolean;
    processos_juridicos: { numero_processo: string | null; tipo: string } | null;
  }[];
  const atencao = prazosQueExigemAtencao(lista, hoje);

  if (atencao.length > 0) {
    const linhas = atencao.map((p) => {
      const rotulo = situacaoPrazo(p, hoje) === "vencido" ? "VENCIDO" : "vence";
      const processo = p.processos_juridicos?.numero_processo ?? p.processos_juridicos?.tipo ?? "processo";
      return `• ${p.descricao} (${processo}) — ${rotulo} ${formatarData(p.data_prazo)}`;
    });
    await alertarAdminGM(`Prazos processuais que exigem atenção:\n${linhas.join("\n")}`);
  }

  return NextResponse.json({ ok: true, prazos_em_alerta: atencao.length });
}
