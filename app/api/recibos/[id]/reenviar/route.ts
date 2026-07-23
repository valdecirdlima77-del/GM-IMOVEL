import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { enviarWhatsApp } from "@/lib/notificacoes/whatsapp";
import { enviarEmail } from "@/lib/notificacoes/email";

type RotaContexto = { params: { id: string } };

// Reenvia um recibo já existente (sem gerar um novo PDF/número) para o
// inquilino e/ou proprietário via WhatsApp/e-mail.
export async function POST(request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const { destino, meio } = (await request.json()) as {
    destino: "inquilino" | "proprietario" | "ambos";
    meio: "whatsapp" | "email";
  };

  const { data: recibo, error } = await supabase
    .from("recibos")
    .select(
      "id, numero_recibo, pdf_url, pagamentos(valor_pago, cobrancas(competencia, imoveis_alugados(endereco_completo, proprietarios(nome, telefone, email), inquilinos(nome, telefone, email))))"
    )
    .eq("id", context.params.id)
    .single();

  if (error || !recibo) {
    return NextResponse.json({ erro: "Recibo não encontrado." }, { status: 404 });
  }

  const pagamento = (recibo as any).pagamentos;
  const locacao = pagamento?.cobrancas?.imoveis_alugados;
  const proprietario = locacao?.proprietarios;
  const inquilino = locacao?.inquilinos;

  const mensagem =
    `Recibo ${(recibo as any).numero_recibo} — ${locacao?.endereco_completo ?? ""}. ` +
    `PDF: ${(recibo as any).pdf_url}`;

  const alvos = destino === "ambos" ? [inquilino, proprietario] : destino === "inquilino" ? [inquilino] : [proprietario];

  for (const alvo of alvos) {
    if (!alvo) continue;
    if (meio === "whatsapp" && alvo.telefone) {
      await enviarWhatsApp(alvo.telefone, mensagem);
    }
    if (meio === "email" && alvo.email) {
      await enviarEmail(alvo.email, `Recibo ${(recibo as any).numero_recibo}`, `<p>${mensagem}</p>`);
    }
  }

  await supabase
    .from("recibos")
    .update({ ultimo_meio_envio: meio })
    .eq("id", context.params.id);

  return NextResponse.json({ ok: true });
}
