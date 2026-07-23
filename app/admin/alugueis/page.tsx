import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import { formatarMoeda, formatarData } from "@/lib/formatadores";

export default async function AlugueisDashboardPage() {
  const supabase = criarClienteSupabaseServidor();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const competenciaAtual = inicioMes.toISOString().slice(0, 10);

  const em7Dias = new Date();
  em7Dias.setDate(em7Dias.getDate() + 7);

  const [
    { count: totalImoveis },
    { count: locacoesAtivas },
    { data: cobrancasMes },
    { count: atrasadas },
    { data: proximasVencer },
  ] = await Promise.all([
    supabase.from("imoveis_alugados").select("*", { count: "exact", head: true }),
    supabase
      .from("imoveis_alugados")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("cobrancas")
      .select("valor_previsto, status")
      .eq("competencia", competenciaAtual),
    supabase
      .from("cobrancas")
      .select("*", { count: "exact", head: true })
      .eq("status", "atrasado"),
    supabase
      .from("cobrancas")
      .select(
        "id, valor_previsto, data_vencimento, status, imoveis_alugados(endereco_completo, inquilinos(nome))"
      )
      .in("status", ["pendente", "atrasado"])
      .lte("data_vencimento", em7Dias.toISOString().slice(0, 10))
      .order("data_vencimento", { ascending: true })
      .limit(10),
  ]);

  const receitaMes = (cobrancasMes ?? [])
    .filter((c) => c.status === "pago")
    .reduce((soma, c) => soma + Number(c.valor_previsto), 0);

  const cartoes = [
    { titulo: "Total de locações", valor: totalImoveis ?? 0 },
    { titulo: "Locações ativas", valor: locacoesAtivas ?? 0 },
    { titulo: "Receita recebida no mês", valor: formatarMoeda(receitaMes) },
    { titulo: "Cobranças em atraso", valor: atrasadas ?? 0, alerta: (atrasadas ?? 0) > 0 },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Visão geral de aluguéis
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cartoes.map((cartao) => (
          <div
            key={cartao.titulo}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">{cartao.titulo}</p>
            <p
              className={`font-heading text-3xl font-bold mt-1 ${
                cartao.alerta ? "text-danger" : "text-graphite"
              }`}
            >
              {cartao.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/admin/alugueis/imoveis-alugados/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Nova locação
        </Link>
        <Link
          href="/admin/alugueis/proprietarios/novo"
          className="bg-secondary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Proprietário
        </Link>
        <Link
          href="/admin/alugueis/inquilinos/novo"
          className="bg-secondary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Inquilino
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-heading font-bold text-graphite">
            Vencimentos próximos (7 dias)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(proximasVencer ?? []).length > 0 ? (
                (proximasVencer as any[]).map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">
                      {c.imoveis_alugados?.endereco_completo ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.imoveis_alugados?.inquilinos?.nome ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatarData(c.data_vencimento)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatarMoeda(c.valor_previsto)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          c.status === "atrasado"
                            ? "bg-danger/10 text-danger"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {c.status === "atrasado" ? "Atrasado" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nenhum vencimento nos próximos 7 dias.
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
