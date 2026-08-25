import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { formatarMoeda, competenciaLabel } from "@/lib/formatadores";

const ROTULOS_TIPO: Record<string, string> = {
  manutencao: "Manutenção",
  reparo: "Reparo",
  taxa: "Taxa",
  iptu: "IPTU",
  condominio: "Condomínio",
  outra: "Outra",
};

export default async function DespesasPage() {
  const supabase = criarClienteSupabaseAdmin();
  const { data: despesas } = await supabase
    .from("despesas")
    .select("id, tipo, descricao, valor, competencia, repassavel, imoveis_alugados(endereco_completo, proprietarios(nome))")
    .order("competencia", { ascending: false });

  const linhas = (despesas ?? []) as any[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-graphite">Despesas</h1>
        <Link
          href="/admin/alugueis/despesas/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Nova despesa
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Competência</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Repassável</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">
                      {d.imoveis_alugados?.endereco_completo ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.imoveis_alugados?.proprietarios?.nome ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ROTULOS_TIPO[d.tipo] ?? d.tipo}</td>
                    <td className="px-4 py-3 text-gray-600">{d.descricao}</td>
                    <td className="px-4 py-3 text-gray-600">{competenciaLabel(d.competencia)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarMoeda(d.valor)}</td>
                    <td className="px-4 py-3">
                      {d.repassavel ? (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-warning/10 text-warning">
                          Sim
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Não</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma despesa lançada ainda.
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
