import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export type PayloadImovelAlugado = {
  imovel_id: string | null;
  proprietario_id: string;
  inquilino_id: string | null;
  endereco_completo: string;
  valor_aluguel: number;
  dia_vencimento: number;
  status: string;
  data_inicio: string;
  data_fim: string | null;
};

function proximaCompetencia(diaVencimento: number): { competencia: string; vencimento: string } {
  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth(); // 0-indexado
  // se já passou o dia de vencimento deste mês, gera a cobrança para o próximo mês
  if (hoje.getDate() > diaVencimento) {
    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
  }
  const mesFmt = String(mes + 1).padStart(2, "0");
  const diaFmt = String(diaVencimento).padStart(2, "0");
  return {
    competencia: `${ano}-${mesFmt}-01`,
    vencimento: `${ano}-${mesFmt}-${diaFmt}`,
  };
}

export async function GET() {
  const supabase = criarClienteSupabaseServidor();
  const { data, error } = await supabase
    .from("imoveis_alugados")
    .select(
      "*, proprietarios(id, nome), inquilinos(id, nome), cobrancas(id, status, data_vencimento, competencia)"
    )
    .order("criado_em", { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ imoveis_alugados: data });
}

export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadImovelAlugado;

  if (!payload.proprietario_id || !payload.endereco_completo || !payload.valor_aluguel) {
    return NextResponse.json(
      { erro: "Proprietário, endereço e valor do aluguel são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: locacao, error: erroLocacao } = await supabase
    .from("imoveis_alugados")
    .insert({
      imovel_id: payload.imovel_id || null,
      proprietario_id: payload.proprietario_id,
      inquilino_id: payload.inquilino_id || null,
      endereco_completo: payload.endereco_completo,
      valor_aluguel: payload.valor_aluguel,
      dia_vencimento: payload.dia_vencimento || 5,
      status: payload.status || "ativo",
      data_inicio: payload.data_inicio || new Date().toISOString().slice(0, 10),
      data_fim: payload.data_fim || null,
    })
    .select()
    .single();

  if (erroLocacao || !locacao) {
    return NextResponse.json(
      { erro: `Erro ao salvar locação: ${erroLocacao?.message ?? ""}` },
      { status: 500 }
    );
  }

  // Gera automaticamente a primeira cobrança pendente da locação.
  const { competencia, vencimento } = proximaCompetencia(payload.dia_vencimento || 5);
  await supabase.from("cobrancas").insert({
    imovel_alugado_id: (locacao as { id: string }).id,
    competencia,
    data_vencimento: vencimento,
    valor_previsto: payload.valor_aluguel,
    status: "pendente",
  });

  return NextResponse.json({ imovel_alugado: locacao }, { status: 201 });
}
