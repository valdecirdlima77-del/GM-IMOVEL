import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { requisicaoAutorizada } from "@/lib/auth/admin";

// Upload e remoção de fotos de um imóvel.
//
// Usa a chave service_role (via criarClienteSupabaseAdmin) porque o upload
// vem do navegador da Geisa autenticado só pelo cookie `gm_admin` — não por
// uma sessão do Supabase Auth. Por isso ESTA ROTA precisa checar esse cookie
// ela mesma antes de fazer qualquer escrita; sem essa checagem, qualquer
// pessoa poderia subir arquivos e gastar o Storage do projeto.
const NOME_BUCKET = "fotos-imoveis";

type RotaContexto = {
  params: { id: string };
};

export async function POST(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const imovelId = context.params.id;

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
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof Blob)) {
    return NextResponse.json(
      { erro: "Nenhum arquivo enviado." },
      { status: 400 }
    );
  }

  const { data: imovel } = await supabase
    .from("imoveis")
    .select("id")
    .eq("id", imovelId)
    .maybeSingle();

  if (!imovel) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  const { count } = await supabase
    .from("fotos")
    .select("id", { count: "exact", head: true })
    .eq("imovel_id", imovelId);

  const ordem = count ?? 0;
  const nomeArquivo = `${imovelId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`;

  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  const { error: erroUpload } = await supabase.storage
    .from(NOME_BUCKET)
    .upload(nomeArquivo, bytes, {
      contentType: "image/webp",
      upsert: false,
    });

  if (erroUpload) {
    return NextResponse.json(
      { erro: `Erro ao enviar a foto: ${erroUpload.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(NOME_BUCKET).getPublicUrl(nomeArquivo);

  const { data: foto, error: erroInsercao } = await supabase
    .from("fotos")
    .insert({
      imovel_id: imovelId,
      url: publicUrl,
      ordem,
      principal: ordem === 0,
    })
    .select()
    .single();

  if (erroInsercao || !foto) {
    return NextResponse.json(
      { erro: `Erro ao salvar a foto: ${erroInsercao?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ foto }, { status: 201 });
}

export async function DELETE(request: NextRequest, context: RotaContexto) {
  if (!requisicaoAutorizada(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fotoId = searchParams.get("fotoId");

  if (!fotoId) {
    return NextResponse.json(
      { erro: "Parâmetro 'fotoId' é obrigatório." },
      { status: 400 }
    );
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

  // Remove só o registro — o arquivo correspondente no Storage fica órfão.
  // Simplificação deliberada: evita risco de apagar o objeto errado ao
  // reconstruir o caminho a partir da URL pública. Custo de Storage de um
  // arquivo órfão é irrelevante perto do ganho de segurança/simplicidade.
  const { error } = await supabase
    .from("fotos")
    .delete()
    .eq("id", fotoId)
    .eq("imovel_id", context.params.id);

  if (error) {
    return NextResponse.json(
      { erro: `Erro ao remover a foto: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
