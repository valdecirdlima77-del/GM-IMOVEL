import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { gerarReciboParaPagamento } from "@/lib/recibos/gerar-recibo";

// Stub de webhook para gateways de pagamento (Stripe, MercadoPago...).
//
// Como ainda não há gateway configurado, esta rota só define o formato
// esperado e o fluxo de baixa. Quando integrar de verdade:
//  1. Valide a assinatura do webhook (ex.: header 'Stripe-Signature' ou
//     'x-signature' do Mercado Pago) usando a secret do provedor.
//  2. Mapeie o payload do provedor para { cobranca_id, valor_pago,
//     referencia_externa } antes de gravar.
export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();

  // TODO: validar assinatura do provedor antes de confiar no payload.
  const payload = (await request.json()) as {
    cobranca_id?: string;
    valor_pago?: number;
    referencia_externa?: string;
    forma_pagamento?: string;
  };

  if (!payload.cobranca_id || !payload.valor_pago) {
    return NextResponse.json(
      { erro: "Payload inválido: cobranca_id e valor_pago são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: pagamento, error } = await supabase
    .from("pagamentos")
    .insert({
      cobranca_id: payload.cobranca_id,
      valor_pago: payload.valor_pago,
      data_pagamento: new Date().toISOString().slice(0, 10),
      forma_pagamento: payload.forma_pagamento || "gateway",
      referencia_externa: payload.referencia_externa || null,
      status: "confirmado",
    })
    .select()
    .single();

  if (error || !pagamento) {
    return NextResponse.json(
      { erro: `Erro ao registrar pagamento via webhook: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  await gerarReciboParaPagamento((pagamento as { id: string }).id);

  return NextResponse.json({ ok: true });
}
