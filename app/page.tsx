import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import ImovelCard from "@/components/imovel/ImovelCard";

export default async function HomePage() {
  const supabase = criarClienteSupabaseServidor();

  // Busca até 6 imóveis publicados para exibir em destaque na home.
  // Se o Supabase ainda não estiver configurado, a lista simplesmente vem vazia
  // (não quebra a página) — assim dá pra rodar o site localmente antes de
  // conectar o banco de dados.
  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("slug, titulo, preco, quartos, area_util, enderecos(bairro, cidade)")
    .eq("status", "publicado")
    .order("criado_em", { ascending: false })
    .limit(6);

  return (
    <div>
      {/* HERO */}
      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
            Seu próximo endereço, com quem conhece o bairro.
          </h1>
          <p className="text-primary-100 max-w-xl mx-auto mb-8">
            Casas e apartamentos para comprar ou alugar, com atendimento
            humano de verdade — do primeiro contato à visita.
          </p>
          <Link
            href="/imoveis"
            className="inline-block bg-secondary text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Buscar imóveis
          </Link>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Imóveis em destaque
        </h2>

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
            Nenhum imóvel publicado ainda. Assim que o banco de dados for
            configurado e os primeiros imóveis cadastrados, eles aparecem
            automaticamente aqui.
          </p>
        )}
      </section>
    </div>
  );
}
