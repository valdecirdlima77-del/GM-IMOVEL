import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { formatarMoeda, competenciaLabel } from "@/lib/formatadores";
import GerarRepasse from "@/components/admin/GerarRepasse";
import AcoesRepasse from "@/components/admin/AcoesRepasse";

const ROTULOS_STATUS: Record<string, string> = {
  calculado: "Calculado",
  confirmado: "Confirmado",
  pago: "Pago",
};

const CORES_STATUS: Record<string, string> = {
  calculado: "bg-warning/10 text-warning",
  confirmado: "bg-primary/10 text-primary",
  pago: "bg-success/10 text-success",
};

export default async function RepassesPage() {
  const supabase = criarClienteSupabaseAdmin();

  const [{ data: repasses }, { data: proprietarios }] = await Promise.all([
    supabase
      .from("repasses")
      .select("id, competencia, valor_bruto, taxa_administracao, total_despesas, valor_liquido, status, demonstrativo_url, proprietarios(nome)")
      .order("competencia", { ascending: false }),
    supabase.from("proprietarios").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const linhas = (repasses ?? []) as any[];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-graphite">Repasses</h1>

      <GerarRepasse proprietarios={proprietarios ?? []} />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Competência</th>
                <th className="px-4 py-3 font-medium">Bruto</th>
                <th className="px-4 py-3 font-medium">Taxa</th>
                <th className="px-4 py-3 font-medium">Despesas</th>
                <th className="px-4 py-3 font-medium">Líquido</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">
                      {r.proprietarios?.nome ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{competenciaLabel(r.competencia)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarMoeda(r.valor_bruto)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarMoeda(r.taxa_administracao)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarMoeda(r.total_despesas)}</td>
                    <td className="px-4 py-3 text-graphite font-bold">{formatarMoeda(r.valor_liquido)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          CORES_STATUS[r.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROTULOS_STATUS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AcoesRepasse repasseId={r.id} status={r.status} demonstrativoUrl={r.demonstrativo_url} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    Nenhum repasse gerado ainda.
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
