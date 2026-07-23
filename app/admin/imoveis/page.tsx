import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type ImovelLinha = {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  preco: number;
  criado_em: string;
};

const ROTULOS_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  em_analise: "Em análise",
  publicado: "Publicado",
  pausado: "Pausado",
  vendido: "Vendido",
  alugado: "Alugado",
};

const CORES_STATUS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-600",
  em_analise: "bg-warning/10 text-warning",
  publicado: "bg-success/10 text-success",
  pausado: "bg-gray-100 text-gray-600",
  vendido: "bg-primary/10 text-primary",
  alugado: "bg-primary/10 text-primary",
};

export default async function AdminListaImoveisPage() {
  const supabase = criarClienteSupabaseServidor();

  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("id, titulo, tipo, status, preco, criado_em")
    .order("criado_em", { ascending: false });

  const linhas = (imoveis ?? []) as ImovelLinha[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-graphite">
          Imóveis
        </h1>
        <Link
          href="/admin/imoveis/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Novo imóvel
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((imovel) => (
                  <tr key={imovel.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">
                      {imovel.titulo}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {imovel.tipo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          CORES_STATUS[imovel.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROTULOS_STATUS[imovel.status] ?? imovel.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {imovel.preco.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(imovel.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/imoveis/${imovel.id}/editar`}
                        className="text-primary hover:underline font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhum imóvel cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
