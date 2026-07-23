import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/formatadores";

export default async function PagamentosPage() {
  const supabase = criarClienteSupabaseServidor();
  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select(
      "id, valor_pago, data_pagamento, forma_pagamento, status, criado_em, cobrancas(competencia, imoveis_alugados(endereco_completo, proprietarios(nome), inquilinos(nome)))"
    )
    .order("criado_em", { ascending: false });

  const linhas = (pagamentos ?? []) as any[];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">Pagamentos</h1>
      <p className="text-sm text-gray-500 mb-4">
        Novos pagamentos são registrados na aba{" "}
        <span className="font-medium text-graphite">Cobranças</span>, com geração automática de recibo.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Data pagamento</th>
                <th className="px-4 py-3 font-medium">Forma</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((p) => {
                  const locacao = p.cobrancas?.imoveis_alugados;
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-graphite font-medium">
                        {locacao?.endereco_completo ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{locacao?.proprietarios?.nome ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{locacao?.inquilinos?.nome ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatarData(p.data_pagamento)}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.forma_pagamento ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatarMoeda(p.valor_pago)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                            p.status === "confirmado"
                              ? "bg-success/10 text-success"
                              : p.status === "estornado"
                              ? "bg-danger/10 text-danger"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhum pagamento registrado ainda.
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
