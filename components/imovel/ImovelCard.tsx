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
}: ImovelCardProps) {
  const precoFormatado = preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Link
      href={`/imoveis/${slug}`}
      className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-44 bg-gray-100">
        {fotoUrl ? (
          <Image src={fotoUrl} alt={titulo} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Sem foto
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-primary font-heading font-bold text-lg">
          {precoFormatado}
        </p>
        <h3 className="font-medium text-graphite mt-1 line-clamp-1">
          {titulo}
        </h3>
        <p className="text-sm text-gray-500">
          {bairro}, {cidade}
        </p>
        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <span>{quartos} quartos</span>
          <span>{areaUtil} m²</span>
        </div>
      </div>
    </Link>
  );
}
