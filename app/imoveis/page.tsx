import { Suspense } from "react";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import ImovelCard from "@/components/imovel/ImovelCard";
import FiltrosImoveis from "@/components/imovel/FiltrosImoveis";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ImovelListado = {
  slug: string;
  titulo: string;
  preco: number;
  quartos: number;
  area_util: number;
  finalidade: string;
  tipo: string;
  enderecos: { bairro: string; cidade: string } | null;
  fotos: { url: string; principal: boolean }[] | null;
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ListaImoveisPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = criarClienteSupabaseServidor();

  let query = supabase
    .from("imoveis")
    .select(
      "slug, titulo, preco, quartos, area_util, finalidade, tipo, enderecos(bairro, cidade), fotos(url, principal)"
    )
    .eq("status", "publicado")
    .order("criado_em", { ascending: false });

  if (params.tipo) query = query.eq("tipo", params.tipo);
  if (params.finalidade) query = query.eq("finalidade", params.finalidade);
  if (params.precoMin) query = query.gte("preco", Number(params.precoMin));
  if (params.precoMax) query = query.lte("preco", Number(params.precoMax));
  if (params.quartos) query = query.gte("quartos", Number(params.quartos));

  const { data, error } = await query;

  let imoveis = (data ?? []) as unknown as ImovelListado[];

  if (params.bairro) {
    const termo = params.bairro.trim().toLowerCase();
    imoveis = imoveis.filter((im) =>
      (im.enderecos?.bairro ?? "").toLowerCase().includes(termo)
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-heading text-2xl font-bold mb-6 text-graphite">
        Imóveis disponíveis
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <Suspense>
            <FiltrosImoveis />
          </Suspense>
        </aside>

        <div className="md:col-span-3">
          {error ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-medium">
                Estamos preparando novos imóveis
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Em breve você verá as ofertas disponíveis aqui.
              </p>
            </div>
          ) : imoveis.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {imoveis.length}{" "}
                {imoveis.length === 1
                  ? "imóvel encontrado"
                  : "imóveis encontrados"}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {imoveis.map((im) => {
                  const foto =
                    im.fotos?.find((f) => f.principal)?.url ??
                    im.fotos?.[0]?.url;
                  return (
                    <ImovelCard
                      key={im.slug}
                      slug={im.slug}
                      titulo={im.titulo}
                      bairro={im.enderecos?.bairro ?? ""}
                      cidade={im.enderecos?.cidade ?? ""}
                      preco={im.preco}
                      quartos={im.quartos}
                      areaUtil={im.area_util}
                      fotoUrl={foto}
                      finalidade={im.finalidade}
                      tipo={im.tipo}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">🏡</div>
              <p className="font-heading text-lg font-semibold text-graphite mb-1">
                Novos imóveis em breve
              </p>
              <p className="text-sm text-gray-500">
                Entre em contato para saber as oportunidades exclusivas.
              </p>
              <a
                href="https://wa.me/5567998500610"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                💬 Falar com Geisa
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
