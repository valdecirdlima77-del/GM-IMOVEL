import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { gerarReciboParaPagamento } from "@/lib/recibos/gerar-recibo";

// Stub de webhook para gateways de pagamento (Stripe, MercadoPago...).
//
// Como ainda não há gateway configurado, esta rota fica DESLIGADA. Antes ela
// aceitava qualquer requisição da internet e dava baixa em cobrança: bastava
// enviar um `cobranca_id` para marcar um aluguel como pago e disparar a
// geração de recibo. Sem gateway, não há assinatura para validar — então a
// resposta correta é não atender.
//
// Para ativar quando houver gateway:
//  1. Validar a assinatura do provedor (ex.: 'Stripe-Signature' ou
//     'x-signature' do Mercado Pago) com a secret dele — é isso que prova que
//     a chamada veio mesmo do gateway.
//  2. Mapear o payload do provedor para { cobranca_id, valor_pago,
//     referencia_externa }.
//  3. Trocar a checagem abaixo pela validação de assinatura.
export async function POST(request: NextRequest) {
  if (!process.env.WEBHOOK_PAGAMENTO_SECRET) {
    return NextResponse.json(
      { erro: "Webhook de pagamento não configurado." },
      { status: 503 }
    );
  }

  if (
    request.headers.get("x-webhook-secret") !==
    process.env.WEBHOOK_PAGAMENTO_SECRET
  ) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const supabase = criarClienteSupabaseAdmin();

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
