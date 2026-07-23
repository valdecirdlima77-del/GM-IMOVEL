import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type ContratoLinha = {
  id: string;
  numero_contrato: string | null;
  data_inicio: string;
  data_fim: string | null;
  valor_aluguel: number;
  status: string;
  imoveis_alugados: {
    endereco_completo: string;
    inquilinos: { nome: string } | null;
  } | null;
};

const ROTULOS_STATUS: Record<string, string> = {
  em_negociacao: "Em negociação",
  ativo: "Ativo",
  encerrado: "Encerrado",
  rescindido: "Rescindido",
};

const CORES_STATUS: Record<string, string> = {
  em_negociacao: "bg-yellow-100 text-yellow-700",
  ativo: "bg-green-100 text-green-700",
  encerrado: "bg-gray-100 text-gray-600",
  rescindido: "bg-red-100 text-red-700",
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminContratosPage() {
  const supabase = criarClienteSupabaseServidor();

  const { data: contratos } = await supabase
    .from("contratos_aluguel")
    .select(
      "id, numero_contrato, data_inicio, data_fim, valor_aluguel, status, imoveis_alugados(endereco_completo, inquilinos(nome))"
    )
    .order("criado_em", { ascending: false });

  const linhas = (contratos ?? []) as unknown as ContratoLinha[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-graphite">
            Contratos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Contratos de locação
          </p>
        </div>
        <Link
          href="/admin/alugueis/imoveis-alugados"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
          style={{ background: "#B8860B" }}
        >
          + Nova locação
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nº</th>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Início</th>
                <th className="px-4 py-3 font-medium">Fim</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">
                      {c.numero_contrato ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.imoveis_alugados?.endereco_completo ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.imoveis_alugados?.inquilinos?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.data_inicio).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.data_fim
                        ? new Date(c.data_fim).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-graphite">
                      {formatarMoeda(Number(c.valor_aluguel))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          CORES_STATUS[c.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROTULOS_STATUS[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum contrato cadastrado.
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
