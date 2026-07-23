import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import ImovelCard from "@/components/imovel/ImovelCard";

export default async function HomePage() {
  const supabase = criarClienteSupabaseServidor();

  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("slug, titulo, preco, quartos, area_util, finalidade, tipo, enderecos(bairro, cidade)")
    .eq("status", "publicado")
    .order("criado_em", { ascending: false })
    .limit(6);

  return (
    <div>
      {/* HERO COM BUSCA INTEGRADA */}
      <section
        className="relative text-white"
        style={{ background: "linear-gradient(135deg, #6B4700 0%, #B8860B 50%, #D4A829 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <p className="text-yellow-200 text-sm font-medium tracking-widest uppercase mb-2">
              Geisa Macena · CRECI-MS 13.429
            </p>
            <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4 drop-shadow-sm">
              Encontre o imóvel ideal
            </h1>
            <p className="text-yellow-100/90 text-lg md:text-xl max-w-2xl mx-auto">
              Compra, venda e locação com assessoria completa em Mato Grosso do Sul
            </p>
          </div>

          {/* BARRA DE BUSCA ESTILO LOPES */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-4xl mx-auto">
            {/* Abas Comprar / Alugar */}
            <div className="flex gap-2 mb-4 border-b border-gray-100 pb-3">
              <a
                href="/imoveis?finalidade=venda"
                className="px-5 py-2 rounded-lg bg-yellow-600 text-white font-semibold text-sm hover:bg-yellow-700 transition-colors"
              >
                Comprar
              </a>
              <a
                href="/imoveis?finalidade=aluguel"
                className="px-5 py-2 rounded-lg text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Alugar
              </a>
            </div>

            <form action="/imoveis" method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input type="hidden" name="finalidade" value="venda" />

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block font-medium">Bairro ou cidade</label>
                <input
                  type="text"
                  name="bairro"
                  placeholder="Ex: Campo Grande, Jardim Veraneio..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Tipo de imóvel</label>
                <select
                  name="tipo"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                  <option value="rural">Rural</option>
                  <option value="galpao">Galpão</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  Buscar
                </button>
              </div>
            </form>
          </div>

          <div className="flex justify-center gap-8 mt-8 text-yellow-100/80 text-sm">
            <span>✓ Contratos seguros</span>
            <span>✓ Atendimento personalizado</span>
            <span>✓ Via agendamento</span>
          </div>
        </div>
      </section>

      {/* NÚMEROS / DESTAQUES */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { numero: "45+", label: "Imóveis para alugar" },
              { numero: "100%", label: "Contratos seguros" },
              { numero: "MS", label: "Mato Grosso do Sul" },
              { numero: "CRECI", label: "13.429 — Geisa Macena" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-heading text-2xl font-bold text-yellow-600">{item.numero}</p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMÓVEIS EM DESTAQUE */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">
              Imóveis em destaque
            </h2>
            <p className="text-gray-500 text-sm mt-1">Selecionados especialmente para você</p>
          </div>
          <Link
            href="/imoveis"
            className="text-sm font-semibold text-yellow-700 hover:text-yellow-800 border border-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

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
                finalidade={imovel.finalidade as string}
                tipo={imovel.tipo as string}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-600 font-medium mb-2">Em breve novos imóveis disponíveis</p>
            <p className="text-gray-400 text-sm mb-6">Entre em contato para saber das oportunidades exclusivas</p>
            <a
              href="https://wa.me/5567998500610"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Falar no WhatsApp
            </a>
          </div>
        )}
      </section>

      {/* SERVIÇOS */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">
              Nossos Serviços
            </h2>
            <p className="text-gray-500 text-sm mt-2">Tudo que você precisa em um só lugar</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🏠", titulo: "Compra e Venda", desc: "Assessoria completa para compra e venda de imóveis residenciais, comerciais e rurais." },
              { icon: "🔑", titulo: "Locações", desc: "Gestão de aluguéis com contratos seguros e acompanhamento contínuo." },
              { icon: "📊", titulo: "Avaliação Imobiliária", desc: "Avaliação técnica do valor de mercado do seu imóvel." },
              { icon: "📋", titulo: "Regularizações", desc: "Regularização de documentação e situação cadastral de imóveis." },
              { icon: "🔍", titulo: "Vistorias", desc: "Vistorias de entrada e saída com relatório fotográfico detalhado." },
              { icon: "📄", titulo: "Documentação", desc: "Elaboração de contratos, aditivos, distratos, notificações, recibos e termos." },
            ].map((servico) => (
              <div
                key={servico.titulo}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg hover:border-yellow-200 transition-all group"
              >
                <div className="text-3xl mb-3">{servico.icon}</div>
                <h3 className="font-heading font-bold text-gray-800 mb-2 group-hover:text-yellow-700 transition-colors">
                  {servico.titulo}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{servico.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WHATSAPP */}
      <section
        className="py-16 text-white text-center"
        style={{ background: "linear-gradient(135deg, #6B4700 0%, #B8860B 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
            Pronto para encontrar seu imóvel?
          </h2>
          <p className="text-yellow-100 mb-8">
            Fale agora com Geisa Macena pelo WhatsApp e receba atendimento personalizado.
          </p>
          <a
            href="https://wa.me/5567998500610?text=Ol%C3%A1%2C%20Geisa!%20Vim%20pelo%20site%20da%20GM%20Neg%C3%B3cios%20Imobili%C3%A1rios%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.826L.057 23.882l6.204-1.626A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.662-.523-5.18-1.432l-.371-.22-3.844 1.007 1.027-3.748-.242-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <p className="text-yellow-200/60 text-xs mt-4">(67) 99850-0610</p>
        </div>
      </section>
    </div>
  );
}
