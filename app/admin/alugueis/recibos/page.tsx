import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { formatarData, formatarDataHora, formatarMoeda } from "@/lib/formatadores";
import AcoesRecibo from "@/components/admin/AcoesRecibo";

export default async function RecibosPage() {
  const supabase = criarClienteSupabaseServidor();
  const { data: recibos } = await supabase
    .from("recibos")
    .select(
      "id, numero_recibo, pdf_url, enviado_inquilino_em, enviado_proprietario_em, criado_em, pagamentos(valor_pago, data_pagamento, cobrancas(competencia, imoveis_alugados(endereco_completo, proprietarios(nome), inquilinos(nome))))"
    )
    .order("criado_em", { ascending: false });

  const linhas = (recibos ?? []) as any[];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">Recibos</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Gerado em</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((r) => {
                  const locacao = r.pagamentos?.cobrancas?.imoveis_alugados;
                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-graphite font-medium">{r.numero_recibo}</td>
                      <td className="px-4 py-3 text-gray-600">{locacao?.endereco_completo ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{locacao?.proprietarios?.nome ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{locacao?.inquilinos?.nome ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatarMoeda(r.pagamentos?.valor_pago)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatarDataHora(r.criado_em)}</td>
                      <td className="px-4 py-3">
                        <AcoesRecibo reciboId={r.id} pdfUrl={r.pdf_url} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhum recibo gerado ainda.
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
