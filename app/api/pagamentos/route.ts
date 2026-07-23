import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { gerarReciboParaPagamento } from "@/lib/recibos/gerar-recibo";

export type PayloadPagamento = {
  cobranca_id: string;
  valor_pago: number;
  data_pagamento: string;
  forma_pagamento: string;
  referencia_externa: string | null;
  observacoes: string;
};

export async function GET() {
  const supabase = criarClienteSupabaseServidor();
  const { data, error } = await supabase
    .from("pagamentos")
    .select(
      "*, cobrancas(id, competencia, data_vencimento, imoveis_alugados(endereco_completo, proprietarios(nome), inquilinos(nome)))"
    )
    .order("criado_em", { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ pagamentos: data });
}

// Registra o pagamento (o trigger no banco já marca a cobrança como "pago")
// e, na sequência, gera e envia o recibo automaticamente.
export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadPagamento;

  if (!payload.cobranca_id || !payload.valor_pago) {
    return NextResponse.json(
      { erro: "Cobrança e valor pago são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: pagamento, error } = await supabase
    .from("pagamentos")
    .insert({
      cobranca_id: payload.cobranca_id,
      valor_pago: payload.valor_pago,
      data_pagamento: payload.data_pagamento || new Date().toISOString().slice(0, 10),
      forma_pagamento: payload.forma_pagamento || null,
      referencia_externa: payload.referencia_externa || null,
      observacoes: payload.observacoes || null,
      status: "confirmado",
    })
    .select()
    .single();

  if (error || !pagamento) {
    return NextResponse.json(
      { erro: `Erro ao registrar pagamento: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  const resultadoRecibo = await gerarReciboParaPagamento(
    (pagamento as { id: string }).id
  );

  return NextResponse.json(
    { pagamento, recibo: resultadoRecibo },
    { status: 201 }
  );
}
