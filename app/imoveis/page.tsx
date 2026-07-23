"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";
import ImovelCard from "@/components/imovel/ImovelCard";
import FiltrosImoveis from "@/components/imovel/FiltrosImoveis";

type ImovelListado = {
  slug: string;
  titulo: string;
  preco: number;
  quartos: number;
  area_util: number;
  enderecos: { bairro: string; cidade: string } | null;
  fotos: { url: string; principal: boolean }[] | null;
};

function ListaImoveisConteudo() {
  const searchParams = useSearchParams();

  const [imoveis, setImoveis] = useState<ImovelListado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string>("");

  useEffect(() => {
    async function buscarImoveis() {
      setCarregando(true);
      setErro("");

      const supabase = criarClienteSupabase();

      let query = supabase
        .from("imoveis")
        .select(
          "slug, titulo, preco, quartos, area_util, enderecos(bairro, cidade), fotos(url, principal)"
        )
        .eq("status", "publicado")
        .order("criado_em", { ascending: false });

      const tipo = searchParams.get("tipo");
      const finalidade = searchParams.get("finalidade");
      const precoMin = searchParams.get("precoMin");
      const precoMax = searchParams.get("precoMax");
      const quartos = searchParams.get("quartos");
      const bairro = searchParams.get("bairro");

      if (tipo) query = query.eq("tipo", tipo);
      if (finalidade) query = query.eq("finalidade", finalidade);
      if (precoMin) query = query.gte("preco", Number(precoMin));
      if (precoMax) query = query.lte("preco", Number(precoMax));
      if (quartos) query = query.gte("quartos", Number(quartos));

      const { data, error } = await query;

      if (error) {
        setErro("Não foi possível carregar os imóveis. Tente novamente.");
        setImoveis([]);
        setCarregando(false);
        return;
      }

      let resultado = (data ?? []) as unknown as ImovelListado[];

      // Filtro por bairro é aplicado no cliente pois depende da tabela relacionada.
      if (bairro) {
        const termo = bairro.trim().toLowerCase();
        resultado = resultado.filter((imovel) =>
          (imovel.enderecos?.bairro ?? "").toLowerCase().includes(termo)
        );
      }

      setImoveis(resultado);
      setCarregando(false);
    }

    buscarImoveis();
  }, [searchParams]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-heading text-2xl font-bold mb-6 text-graphite">
        Imóveis disponíveis
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <FiltrosImoveis />
        </aside>

        <div className="md:col-span-3">
          {carregando ? (
            <p className="text-gray-500">Carregando imóveis...</p>
          ) : erro ? (
            <p className="text-danger">{erro}</p>
          ) : imoveis.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {imoveis.length}{" "}
                {imoveis.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {imoveis.map((imovel) => {
                  const fotoPrincipal =
                    imovel.fotos?.find((f) => f.principal)?.url ??
                    imovel.fotos?.[0]?.url;

                  return (
                    <ImovelCard
                      key={imovel.slug}
                      slug={imovel.slug}
                      titulo={imovel.titulo}
                      bairro={imovel.enderecos?.bairro ?? ""}
                      cidade={imovel.enderecos?.cidade ?? ""}
                      preco={imovel.preco}
                      quartos={imovel.quartos}
                      areaUtil={imovel.area_util}
                      fotoUrl={fotoPrincipal}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-gray-500">
              Nenhum imóvel encontrado com os filtros selecionados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListaImoveisPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-10">Carregando...</div>}>
      <ListaImoveisConteudo />
    </Suspense>
  );
}
