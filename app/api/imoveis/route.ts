import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type PayloadImovel = {
  titulo: string;
  slug: string;
  descricao: string;
  tipo: string;
  finalidade: string;
  status: string;
  preco: number;
  condominio: number | null;
  iptu: number | null;
  area_util: number | null;
  quartos: number;
  banheiros: number;
  vagas_garagem: number;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

const EMAIL_CORRETOR_PADRAO = "geisa@gmimoveis.local";

async function obterOuCriarCorretorPadrao(
  supabase: ReturnType<typeof criarClienteSupabaseServidor>
): Promise<{ id: string } | null> {
  const { data: corretorExistente } = await supabase
    .from("corretores")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (corretorExistente) {
    return corretorExistente as { id: string };
  }

  // Não existe nenhum corretor ainda — cria um usuário + corretor padrão
  // para que o cadastro de imóveis funcione antes de existir autenticação.
  let usuarioId: string | null = null;

  const { data: usuarioExistente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", EMAIL_CORRETOR_PADRAO)
    .maybeSingle();

  if (usuarioExistente) {
    usuarioId = (usuarioExistente as { id: string }).id;
  } else {
    const { data: novoUsuario, error: erroUsuario } = await supabase
      .from("usuarios")
      .insert({
        nome: "Geisa Macena",
        email: EMAIL_CORRETOR_PADRAO,
        papel: "corretor",
      })
      .select("id")
      .single();

    if (erroUsuario || !novoUsuario) {
      return null;
    }
    usuarioId = (novoUsuario as { id: string }).id;
  }

  const { data: novoCorretor, error: erroCorretor } = await supabase
    .from("corretores")
    .insert({ usuario_id: usuarioId })
    .select("id")
    .single();

  if (erroCorretor || !novoCorretor) {
    return null;
  }

  return novoCorretor as { id: string };
}

export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadImovel;

  if (!payload.titulo || !payload.slug) {
    return NextResponse.json(
      { erro: "Título e slug são obrigatórios." },
      { status: 400 }
    );
  }

  const corretor = await obterOuCriarCorretorPadrao(supabase);
  if (!corretor) {
    return NextResponse.json(
      { erro: "Não foi possível preparar o corretor responsável pelo imóvel." },
      { status: 500 }
    );
  }

  const { data: endereco, error: erroEndereco } = await supabase
    .from("enderecos")
    .insert({
      logradouro: payload.logradouro,
      numero: payload.numero || null,
      complemento: payload.complemento || null,
      bairro: payload.bairro,
      cidade: payload.cidade,
      estado: payload.estado,
      cep: payload.cep || null,
    })
    .select("id")
    .single();

  if (erroEndereco || !endereco) {
    return NextResponse.json(
      { erro: `Erro ao salvar endereço: ${erroEndereco?.message ?? ""}` },
      { status: 500 }
    );
  }

  const { data: imovel, error: erroImovel } = await supabase
    .from("imoveis")
    .insert({
      corretor_id: corretor.id,
      endereco_id: (endereco as { id: string }).id,
      titulo: payload.titulo,
      slug: payload.slug,
      descricao: payload.descricao || null,
      tipo: payload.tipo,
      finalidade: payload.finalidade,
      status: payload.status,
      preco: payload.preco,
      condominio: payload.condominio,
      iptu: payload.iptu,
      area_util: payload.area_util,
      quartos: payload.quartos,
      banheiros: payload.banheiros,
      vagas_garagem: payload.vagas_garagem,
    })
    .select()
    .single();

  if (erroImovel || !imovel) {
    return NextResponse.json(
      { erro: `Erro ao salvar imóvel: ${erroImovel?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ imovel }, { status: 201 });
}
