import Image from "next/image";
import Link from "next/link";

type ImovelCardProps = {
  slug: string;
  titulo: string;
  bairro: string;
  cidade: string;
  preco: number;
  quartos: number;
  areaUtil: number;
  fotoUrl?: string;
  finalidade?: string;
  tipo?: string;
};

export default function ImovelCard({
  slug,
  titulo,
  bairro,
  cidade,
  preco,
  quartos,
  areaUtil,
  fotoUrl,
  finalidade,
  tipo,
}: ImovelCardProps) {
  const precoFormatado = preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const badgeLabel =
    finalidade === "aluguel" ? "Aluguel" : finalidade === "venda" ? "Venda" : null;

  return (
    <Link
      href={`/imoveis/${slug}`}
      className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
    >
      <div className="relative h-52 bg-gray-100">
        {fotoUrl ? (
          <Image src={fotoUrl} alt={titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-xs">Sem foto</span>
          </div>
        )}
        {badgeLabel && (
          <span
            className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${
              finalidade === "aluguel"
                ? "bg-blue-600 text-white"
                : "bg-yellow-600 text-white"
            }`}
          >
            {badgeLabel}
          </span>
        )}
        {tipo && (
          <span className="absolute top-3 right-3 text-xs bg-black/40 text-white px-2 py-0.5 rounded-full capitalize">
            {tipo}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="font-heading font-bold text-xl text-yellow-700">
          {precoFormatado}
          {finalidade === "aluguel" && (
            <span className="text-sm font-normal text-gray-400">/mês</span>
          )}
        </p>
        <h3 className="font-medium text-gray-800 mt-1 line-clamp-2 leading-snug">
          {titulo}
        </h3>
        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {bairro}{bairro && cidade ? ", " : ""}{cidade}
        </p>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          {quartos > 0 && (
            <span className="flex items-center gap-1">
              🛏 {quartos} {quartos === 1 ? "quarto" : "quartos"}
            </span>
          )}
          {areaUtil > 0 && (
            <span className="flex items-center gap-1">
              📐 {areaUtil} m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
