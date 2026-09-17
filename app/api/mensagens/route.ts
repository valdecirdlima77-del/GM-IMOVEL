import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { alertarAdminGM } from "@/lib/notificacoes/whatsapp";

// Recebe o formulário de contato do site público e grava em `mensagens`.
//
// Sem vínculo com `clientes` de propósito: quem preenche esse formulário
// ainda não tem cadastro nenhum no sistema. Nome/e-mail/telefone vão dentro
// do próprio texto da mensagem para não exigir criar um cliente fantasma
// só para satisfazer uma FK.
export async function POST(request: NextRequest) {
  let corpo: {
    nome?: unknown;
    email?: unknown;
    telefone?: unknown;
    mensagem?: unknown;
  };

  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido: esperado JSON." },
      { status: 400 }
    );
  }

  const nome = typeof corpo.nome === "string" ? corpo.nome.trim() : "";
  const email = typeof corpo.email === "string" ? corpo.email.trim() : "";
  const telefone = typeof corpo.telefone === "string" ? corpo.telefone.trim() : "";
  const mensagem = typeof corpo.mensagem === "string" ? corpo.mensagem.trim() : "";

  if (!nome || !email || !mensagem) {
    return NextResponse.json(
      { erro: "Nome, e-mail e mensagem são obrigatórios." },
      { status: 400 }
    );
  }

  const conteudo =
    `Nome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone || "-"}\n\n${mensagem}`;

  const supabase = criarClienteSupabaseAdmin();

  const { error } = await supabase.from("mensagens").insert({
    origem: "chat_site",
    remetente: "cliente",
    conteudo,
  });

  if (error) {
    return NextResponse.json(
      { erro: `Erro ao registrar mensagem: ${error.message}` },
      { status: 500 }
    );
  }

  // Melhor esforço: avisa a Geisa que chegou uma mensagem pelo site. Se o
  // WhatsApp ainda estiver em modo stub, isso só fica registrado no log do
  // servidor — não impede o formulário de gravar a mensagem.
  await alertarAdminGM(
    `Nova mensagem pelo site — ${nome} (${telefone || email}): ${mensagem}`
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
