import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { formatarData, formatarMoeda, competenciaLabel } from "@/lib/formatadores";
import AcoesCobranca from "@/components/admin/AcoesCobranca";

const ROTULOS_STATUS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const CORES_STATUS: Record<string, string> = {
  pendente: "bg-warning/10 text-warning",
  pago: "bg-success/10 text-success",
  atrasado: "bg-danger/10 text-danger",
  cancelado: "bg-gray-100 text-gray-500",
};

export default async function CobrancasPage() {
  const supabase = criarClienteSupabaseServidor();
  const { data: cobrancas } = await supabase
    .from("cobrancas")
    .select(
      "id, competencia, data_vencimento, valor_previsto, status, imoveis_alugados(endereco_completo, inquilinos(nome))"
    )
    .order("data_vencimento", { ascending: true });

  const linhas = (cobrancas ?? []) as any[];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">Cobranças</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Competência</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">
                      {c.imoveis_alugados?.endereco_completo ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.imoveis_alugados?.inquilinos?.nome ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{competenciaLabel(c.competencia)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarData(c.data_vencimento)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatarMoeda(c.valor_previsto)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          CORES_STATUS[c.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROTULOS_STATUS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AcoesCobranca cobrancaId={c.id} status={c.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma cobrança gerada ainda.
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
