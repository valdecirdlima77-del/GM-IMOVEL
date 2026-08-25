import { NextRequest, NextResponse } from "next/server";
import { gerarReciboParaPagamento } from "@/lib/recibos/gerar-recibo";
import { requisicaoAutorizada } from "@/lib/auth/admin";

// POST /api/recibos/generate { pagamento_id }
// Gera (ou regera) o PDF do recibo de um pagamento e envia para
// inquilino + proprietário via WhatsApp/e-mail. Usado tanto automaticamente
// (a partir de /api/pagamentos) quanto manualmente (botão "Reenviar" na
// tela /admin/alugueis/recibos).
//
// Exige sessão: além de gravar no banco, esta rota DISPARA MENSAGEM para
// inquilino e proprietário. Aberta, permitiria que qualquer um fizesse o
// sistema enviar recibos em nome da imobiliária.
export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { pagamento_id: pagamentoId } = (await request.json()) as {
    pagamento_id: string;
  };

  if (!pagamentoId) {
    return NextResponse.json(
      { erro: "pagamento_id é obrigatório." },
      { status: 400 }
    );
  }

  const resultado = await gerarReciboParaPagamento(pagamentoId);

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 500 });
  }

  return NextResponse.json(resultado, { status: 201 });
}
