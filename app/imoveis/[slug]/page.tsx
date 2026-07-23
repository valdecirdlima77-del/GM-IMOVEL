import { notFound } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import GaleriaFotos from "@/components/imovel/GaleriaFotos";

type ImovelDetalhe = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  finalidade: string;
  preco: number;
  condominio: number | null;
  iptu: number | null;
  area_util: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas_garagem: number | null;
  enderecos: {
    bairro: string;
    cidade: string;
    estado: string;
    logradouro: string;
    numero: string | null;
  } | null;
  fotos: { url: string; ordem: number; principal: boolean }[] | null;
};

const WHATSAPP_NUMERO = "5567998500610";

type PaginaImovelProps = {
  params: { slug: string };
};

export default async function ImovelDetalhePage({ params }: PaginaImovelProps) {
  const supabase = criarClienteSupabaseServidor();

  const { data: imovel } = await supabase
    .from("imoveis")
    .select(
      "id, titulo, descricao, tipo, finalidade, preco, condominio, iptu, area_util, quartos, banheiros, vagas_garagem, enderecos(bairro, cidade, estado, logradouro, numero), fotos(url, ordem, principal)"
    )
    .eq("slug", params.slug)
    .eq("status", "publicado")
    .single();

  if (!imovel) {
    notFound();
  }

  const dados = imovel as unknown as ImovelDetalhe;

  const precoFormatado = dados.preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const fotosOrdenadas = [...(dados.fotos ?? [])].sort(
    (a, b) => a.ordem - b.ordem
  );

  const mensagemWhatsapp = encodeURIComponent(
    `Olá! Tenho interesse no imóvel "${dados.titulo}" (${precoFormatado}). Podemos conversar?`
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <GaleriaFotos fotos={fotosOrdenadas} titulo={dados.titulo} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <span className="inline-block text-xs font-medium uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded">
            {dados.finalidade === "venda" ? "Venda" : "Aluguel"} · {dados.tipo}
          </span>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-graphite mt-3">
            {dados.titulo}
          </h1>

          <p className="text-gray-500 mt-1">
            {dados.enderecos?.logradouro}
            {dados.enderecos?.numero ? `, ${dados.enderecos.numero}` : ""} —{" "}
            {dados.enderecos?.bairro}, {dados.enderecos?.cidade}/
            {dados.enderecos?.estado}
          </p>

          <p className="font-heading text-3xl font-bold text-primary mt-4">
            {precoFormatado}
            {dados.finalidade === "aluguel" && (
              <span className="text-base font-normal text-gray-500">/mês</span>
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-b border-gray-200 py-5">
            <div>
              <p className="text-sm text-gray-500">Quartos</p>
              <p className="font-medium text-graphite">{dados.quartos ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Banheiros</p>
              <p className="font-medium text-graphite">{dados.banheiros ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vagas</p>
              <p className="font-medium text-graphite">
                {dados.vagas_garagem ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Área útil</p>
              <p className="font-medium text-graphite">
                {dados.area_util ?? "-"} m²
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-heading font-bold text-lg text-graphite mb-2">
              Descrição
            </h2>
            <p className="text-gray-600 whitespace-pre-line">
              {dados.descricao ?? "Sem descrição disponível."}
            </p>
          </div>

          {(dados.condominio || dados.iptu) && (
            <div className="mt-6 flex gap-6">
              {dados.condominio ? (
                <div>
                  <p className="text-sm text-gray-500">Condomínio</p>
                  <p className="font-medium text-graphite">
                    {dados.condominio.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              ) : null}
              {dados.iptu ? (
                <div>
                  <p className="text-sm text-gray-500">IPTU</p>
                  <p className="font-medium text-graphite">
                    {dados.iptu.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Card de contato */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20">
            <h2 className="font-heading font-bold text-graphite text-lg mb-3">
              Interessado?
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Fale agora com um de nossos corretores pelo WhatsApp.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${mensagemWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-secondary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Conversar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
