import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminDashboardPage() {
  const supabase = criarClienteSupabaseServidor();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const competenciaAtual = inicioMes.toISOString().slice(0, 10);

  const em7Dias = new Date();
  em7Dias.setDate(em7Dias.getDate() + 7);
  const em7DiasStr = em7Dias.toISOString().slice(0, 10);

  const [
    { count: totalImoveis },
    { count: publicados },
    { count: locacoesAtivas },
    { count: agendamentosPendentes },
    { data: cobrancasMes },
    { count: cobrancasAtrasadas },
    { count: cobrancasPendentes7d },
    { count: totalRecibos },
    { count: contratosAtivos },
    { data: proximasVencer },
  ] = await Promise.all([
    supabase.from("imoveis").select("*", { count: "exact", head: true }),
    supabase
      .from("imoveis")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado"),
    supabase
      .from("imoveis_alugados")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "solicitado"),
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
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente")
      .lte("data_vencimento", em7DiasStr),
    supabase.from("recibos").select("*", { count: "exact", head: true }),
    supabase
      .from("contratos_aluguel")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("cobrancas")
      .select(
        "id, valor_previsto, data_vencimento, status, imoveis_alugados(endereco_completo)"
      )
      .in("status", ["pendente", "atrasado"])
      .order("data_vencimento", { ascending: true })
      .limit(6),
  ]);

  const receitaMesPaga = (cobrancasMes ?? [])
    .filter((c: { status: string }) => c.status === "pago")
    .reduce(
      (soma: number, c: { valor_previsto: number }) =>
        soma + Number(c.valor_previsto),
      0
    );

  const receitaMesPrevista = (cobrancasMes ?? []).reduce(
    (soma: number, c: { valor_previsto: number }) =>
      soma + Number(c.valor_previsto),
    0
  );

  const destaques = [
    {
      titulo: "Cobranças",
      valor: cobrancasAtrasadas ?? 0,
      subtitulo: `${cobrancasPendentes7d ?? 0} vencem em 7 dias`,
      cor: "#B8860B",
      icone: "💰",
      href: "/admin/alugueis/cobrancas",
    },
    {
      titulo: "Recibos",
      valor: totalRecibos ?? 0,
      subtitulo: "emitidos",
      cor: "#10B981",
      icone: "🧾",
      href: "/admin/alugueis/recibos",
    },
    {
      titulo: "Contratos",
      valor: contratosAtivos ?? 0,
      subtitulo: "ativos",
      cor: "#3B82F6",
      icone: "📄",
      href: "/admin/alugueis/contratos",
    },
  ];

  const secundarios = [
    {
      titulo: "Locações ativas",
      valor: locacoesAtivas ?? 0,
      href: "/admin/alugueis/imoveis-alugados",
    },
    {
      titulo: "Receita do mês (paga)",
      valor: formatarMoeda(receitaMesPaga),
      href: "/admin/alugueis",
    },
    {
      titulo: "Receita prevista",
      valor: formatarMoeda(receitaMesPrevista),
      href: "/admin/alugueis",
    },
    {
      titulo: "Imóveis publicados",
      valor: `${publicados ?? 0} / ${totalImoveis ?? 0}`,
      href: "/admin/imoveis",
    },
    {
      titulo: "Agendamentos pendentes",
      valor: agendamentosPendentes ?? 0,
      href: "/admin/agendamentos",
    },
  ];

  const linhasProximas = (proximasVencer ?? []) as unknown as {
    id: string;
    valor_previsto: number;
    data_vencimento: string;
    status: string;
    imoveis_alugados: { endereco_completo: string } | null;
  }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-graphite">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral da gestão de aluguéis
        </p>
      </div>

      {/* DESTAQUES: Cobranças / Recibos / Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {destaques.map((d) => (
          <Link
            key={d.titulo}
            href={d.href}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{d.icone}</span>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: `${d.cor}15`, color: d.cor }}
              >
                {d.titulo}
              </span>
            </div>
            <p className="font-heading text-4xl font-bold text-graphite">
              {d.valor}
            </p>
            <p className="text-sm text-gray-500 mt-1">{d.subtitulo}</p>
          </Link>
        ))}
      </div>

      {/* Próximos vencimentos */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-graphite text-lg">
            Próximos vencimentos
          </h2>
          <Link
            href="/admin/alugueis/cobrancas"
            className="text-sm font-medium text-yellow-700 hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {linhasProximas.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {linhasProximas.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-graphite">
                    {c.imoveis_alugados?.endereco_completo ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Venc:{" "}
                    {new Date(c.data_vencimento).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-graphite">
                    {formatarMoeda(Number(c.valor_previsto))}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      c.status === "atrasado"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-6 text-center">
            Nenhuma cobrança em aberto.
          </p>
        )}
      </div>

      {/* Cartões secundários */}
      <div>
        <h2 className="font-heading font-bold text-graphite text-lg mb-3">
          Outras métricas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {secundarios.map((s) => (
            <Link
              key={s.titulo}
              href={s.href}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-yellow-500 transition-colors"
            >
              <p className="text-xs text-gray-500">{s.titulo}</p>
              <p className="font-heading text-lg font-bold text-graphite mt-1">
                {s.valor}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/imoveis/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Cadastrar imóvel
        </Link>
        <Link
          href="/admin/alugueis/imoveis-alugados"
          className="bg-graphite text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Nova locação
        </Link>
        <Link
          href="/admin/alugueis/cobrancas"
          className="border border-gray-300 text-graphite text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Ver cobranças
        </Link>
      </div>
    </div>
  );
}
