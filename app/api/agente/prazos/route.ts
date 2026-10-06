import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { agenteAutorizado } from "@/lib/auth/agente";
import { dataSomandoDias, hojeNoEscritorio } from "@/lib/datas";
import { situacaoPrazo } from "@/lib/juridico/prazos";

// GET /api/agente/prazos?dias=7
//
// Prazos processuais em aberto que vencem nos próximos N dias (padrão 7) ou
// que já venceram. Somente leitura. Não devolve dados de cliente nem CPF.
export async function GET(request: NextRequest) {
  if (!agenteAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const diasBruto = Number(request.nextUrl.searchParams.get("dias") ?? 7);
  const dias = Number.isFinite(diasBruto) ? Math.min(Math.max(Math.trunc(diasBruto), 0), 60) : 7;

  const hoje = hojeNoEscritorio();
  const limite = dataSomandoDias(hoje, dias);

  const supabase = criarClienteSupabaseAdmin();
  const { data, error } = await supabase
    .from("prazos_processuais")
    .select("id, descricao, data_prazo, concluido, processos_juridicos(numero_processo, tipo, status)")
    .eq("concluido", false)
    .lte("data_prazo", limite)
    .order("data_prazo", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível consultar os prazos." }, { status: 500 });
  }

  const prazos = (data ?? []).map((p) => {
    const processo = p.processos_juridicos as unknown as
      | { numero_processo: string | null; tipo: string; status: string }
      | null;
    return {
      descricao: p.descricao,
      data_prazo: p.data_prazo,
      situacao: situacaoPrazo({ data_prazo: p.data_prazo, concluido: p.concluido }, hoje),
      processo: processo?.numero_processo ?? processo?.tipo ?? null,
      status_processo: processo?.status ?? null,
    };
  });

  return NextResponse.json({ hoje, ate: limite, total: prazos.length, prazos });
}
