import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";
import { enviarFotoDoImovel } from "@/lib/fotos/enviar";

// POST /api/fotos/upload — multipart com campos `imovel_id` e `arquivo`.
// Mesmo fluxo e mesmo bucket de POST /api/imoveis/[id]/fotos. Exige o cookie
// gm_admin e usa service role, porque o navegador não grava mais direto no banco.
export async function POST(request: NextRequest) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let supabase;
  try {
    supabase = criarClienteSupabaseAdmin();
  } catch (erro) {
    return NextResponse.json(
      {
        erro:
          erro instanceof Error
            ? erro.message
            : "Configuração do Supabase ausente.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const imovelId = formData.get("imovel_id");
  const arquivo = formData.get("arquivo");

  if (typeof imovelId !== "string" || !imovelId) {
    return NextResponse.json({ erro: "Imóvel não informado." }, { status: 400 });
  }
  if (!(arquivo instanceof Blob)) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const resultado = await enviarFotoDoImovel(supabase, imovelId, arquivo);
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: resultado.status });
  }
  return NextResponse.json({ foto: resultado.foto }, { status: 201 });
}
