import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import ImovelCard from "@/components/imovel/ImovelCard";

export default async function HomePage() {
  const supabase = criarClienteSupabaseServidor();

  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("slug, titulo, preco, quartos, area_util, enderecos(bairro, cidade)")
    .eq("status", "publicado")
    .order("criado_em", { ascending: false })
    .limit(6);

  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
            GM Negócios Imobiliários
          </h1>
          <p className="text-primary-100 max-w-2xl mx-auto mb-2 text-lg">
            Assessoria completa em negócios imobiliários
          </p>
          <p className="text-primary-100/80 max-w-xl mx-auto mb-8 text-sm">
            Compra e Venda · Locações · Avaliação · Regularizações · Vistorias · Documentação
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/imoveis"
              className="inline-block bg-white text-primary font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Buscar imóveis
            </Link>
            <a
              href="https://wa.me/5567998500610?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20GM%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-secondary text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Falar no WhatsApp
            </a>
          </div>
          <p className="text-primary-100/60 text-xs mt-6">
            Geisa Macena — CRECI-MS 13.429
          </p>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold mb-8 text-center">
          Nossos Serviços
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { titulo: "Compra e Venda", desc: "Assessoria completa para compra e venda de imóveis residenciais, comerciais e rurais." },
            { titulo: "Locações", desc: "Gestão de aluguéis com contratos seguros e acompanhamento contínuo." },
            { titulo: "Avaliação Imobiliária", desc: "Avaliação técnica do valor de mercado do seu imóvel." },
            { titulo: "Regularizações", desc: "Regularização de documentação e situação cadastral de imóveis." },
            { titulo: "Vistorias", desc: "Vistorias de entrada e saída com relatório fotográfico detalhado." },
            { titulo: "Documentação", desc: "Elaboração de contratos, aditivos, distratos, notificações, recibos e termos." },
          ].map((servico) => (
            <div key={servico.titulo} className="bg-white border border-gold-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-heading font-bold text-primary mb-2">{servico.titulo}</h3>
              <p className="text-sm text-gray-600">{servico.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold mb-6">
          Imóveis em destaque
        </h2>

        {imoveis && imoveis.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imoveis.map((imovel: Record<string, unknown>) => (
              <ImovelCard
                key={imovel.slug as string}
                slug={imovel.slug as string}
                titulo={imovel.titulo as string}
                bairro={(imovel.enderecos as Record<string, string>)?.bairro ?? ""}
                cidade={(imovel.enderecos as Record<string, string>)?.cidade ?? ""}
                preco={imovel.preco as number}
                quartos={imovel.quartos as number}
                areaUtil={imovel.area_util as number}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            Em breve novos imóveis disponíveis. Entre em contato para saber mais!
          </p>
        )}
      </section>
    </div>
  );
}
