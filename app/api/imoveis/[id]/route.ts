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

type RotaContexto = {
  params: { id: string };
};

export async function PUT(request: NextRequest, context: RotaContexto) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadImovel;
  const imovelId = context.params.id;

  const { data: imovelAtual, error: erroBusca } = await supabase
    .from("imoveis")
    .select("endereco_id")
    .eq("id", imovelId)
    .single();

  if (erroBusca || !imovelAtual) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  const enderecoId = (imovelAtual as { endereco_id: string }).endereco_id;

  const { error: erroEndereco } = await supabase
    .from("enderecos")
    .update({
      logradouro: payload.logradouro,
      numero: payload.numero || null,
      complemento: payload.complemento || null,
      bairro: payload.bairro,
      cidade: payload.cidade,
      estado: payload.estado,
      cep: payload.cep || null,
    })
    .eq("id", enderecoId);

  if (erroEndereco) {
    return NextResponse.json(
      { erro: `Erro ao atualizar endereço: ${erroEndereco.message}` },
      { status: 500 }
    );
  }

  const { data: imovel, error: erroImovel } = await supabase
    .from("imoveis")
    .update({
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
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", imovelId)
    .select()
    .single();

  if (erroImovel || !imovel) {
    return NextResponse.json(
      { erro: `Erro ao atualizar imóvel: ${erroImovel?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ imovel }, { status: 200 });
}
