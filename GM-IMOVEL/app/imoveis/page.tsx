import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import ImovelCard from "@/components/imovel/ImovelCard";

export default async function ListaImoveisPage() {
  const supabase = criarClienteSupabaseServidor();

  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("slug, titulo, preco, quartos, area_util, enderecos(bairro, cidade)")
    .eq("status", "publicado")
    .order("criado_em", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-heading text-2xl font-bold mb-6">
        Imóveis disponíveis
      </h1>

      {/* Filtros de busca serão adicionados aqui (localização, preço,
          quartos, tipo) — este é o esqueleto inicial da tela. */}

      {imoveis && imoveis.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((imovel: any) => (
            <ImovelCard
              key={imovel.slug}
              slug={imovel.slug}
              titulo={imovel.titulo}
              bairro={imovel.enderecos?.bairro ?? ""}
              cidade={imovel.enderecos?.cidade ?? ""}
              preco={imovel.preco}
              quartos={imovel.quartos}
              areaUtil={imovel.area_util}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          Nenhum imóvel publicado ainda.
        </p>
      )}
    </div>
  );
}
