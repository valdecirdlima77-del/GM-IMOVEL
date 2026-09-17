import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { agenteAutorizado } from "@/lib/auth/agente";

// GET /api/agente/imoveis?cidade=&bairro=&tipo=&finalidade=
//
// Só devolve imóveis com status "publicado" — é exatamente o mesmo filtro
// que a página pública /imoveis usa. Dado público por natureza, mas a rota
// ainda exige o segredo do agente para não virar um scraper aberto de
// terceiros.
export async function GET(request: NextRequest) {
  if (!agenteAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const cidade = params.get("cidade");
  const bairro = params.get("bairro");
  const tipo = params.get("tipo");
  const finalidade = params.get("finalidade");

  const supabase = criarClienteSupabaseAdmin();
  // enderecos!inner: sem o !inner o PostgREST não usa o filtro de
  // cidade/bairro para restringir as linhas de `imoveis`, só filtra o
  // conteúdo aninhado — cidade/bairro informados pela Agente Geisa não
  // filtravam nada.
  let query = supabase
    .from("imoveis")
    .select(
      "id, titulo, slug, tipo, finalidade, preco, condominio, iptu, area_util, quartos, banheiros, vagas_garagem, enderecos!inner(bairro, cidade, estado)"
    )
    .eq("status", "publicado")
    .order("criado_em", { ascending: false })
    .limit(20);

  if (tipo) query = query.eq("tipo", tipo);
  if (finalidade) query = query.eq("finalidade", finalidade);
  if (cidade) query = query.eq("enderecos.cidade", cidade);
  if (bairro) query = query.eq("enderecos.bairro", bairro);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ imoveis: data ?? [] });
}
