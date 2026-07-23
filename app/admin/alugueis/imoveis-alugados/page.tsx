import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/formatadores";

const ROTULOS_STATUS: Record<string, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
  inadimplente: "Inadimplente",
  em_renovacao: "Em renovação",
};

const CORES_STATUS: Record<string, string> = {
  ativo: "bg-success/10 text-success",
  encerrado: "bg-gray-100 text-gray-600",
  inadimplente: "bg-danger/10 text-danger",
  em_renovacao: "bg-warning/10 text-warning",
};

export default async function ImoveisAlugadosPage() {
  const supabase = criarClienteSupabaseServidor();
  const { data: locacoes } = await supabase
    .from("imoveis_alugados")
    .select(
      "id, endereco_completo, valor_aluguel, dia_vencimento, status, proprietarios(nome), inquilinos(nome)"
    )
    .order("criado_em", { ascending: false });

  const linhas = (locacoes ?? []) as any[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-graphite">
          Imóveis alugados <span className="text-gray-400 font-normal text-lg">({linhas.length})</span>
        </h1>
        <Link
          href="/admin/alugueis/imoveis-alugados/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Nova locação
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Endereço</th>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Aluguel</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">{l.endereco_completo}</td>
                    <td className="px-4 py-3 text-gray-600">{l.proprietarios?.nome ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{l.inquilinos?.nome ?? "Vago"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarMoeda(l.valor_aluguel)}</td>
                    <td className="px-4 py-3 text-gray-600">dia {l.dia_vencimento}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          CORES_STATUS[l.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROTULOS_STATUS[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/alugueis/imoveis-alugados/${l.id}/editar`}
                        className="text-primary hover:underline font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma locação cadastrada ainda.
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
