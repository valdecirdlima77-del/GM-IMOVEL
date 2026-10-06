import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/auth/cron";
import { dataSomandoDias, hojeNoEscritorio } from "@/lib/datas";
import { competenciaDe } from "@/lib/financeiro/competencia";
import { gerarRepassesDaCompetencia } from "@/lib/repasses/gerar";

// Dia 1 de cada mês: fecha o mês anterior e gera os repasses aos proprietários.
// Agendado às 10h de Brasília (13h UTC): { "path": ..., "schedule": "0 13 1 * *" }
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const hoje = hojeNoEscritorio();
  const diaDoMesAnterior = dataSomandoDias(`${hoje.slice(0, 7)}-01`, -1);
  const competencia = competenciaDe(
    Number(diaDoMesAnterior.slice(0, 4)),
    Number(diaDoMesAnterior.slice(5, 7))
  );

  try {
    const resultado = await gerarRepassesDaCompetencia(criarClienteSupabaseAdmin(), competencia);
    return NextResponse.json({ ok: true, ...resultado });
  } catch {
    return NextResponse.json({ erro: "Falha ao gerar repasses." }, { status: 500 });
  }
}
