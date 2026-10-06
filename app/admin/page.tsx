import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { dataSomandoDias, hojeNoEscritorio } from "@/lib/datas";
import { prazosQueExigemAtencao } from "@/lib/juridico/prazos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminDashboardPage() {
  const supabase = criarClienteSupabaseAdmin();

  const hoje = hojeNoEscritorio();
  const competenciaAtual = `${hoje.slice(0, 7)}-01`;
  const limiteSeteDias = dataSomandoDias(hoje, 7);

  const [
    { count: totalImoveis },
    { count: publicados },
    { count: locacoesAtivas },
    { count: agendamentosPendentes },
    { data: cobrancasMes },
    { count: cobrancasAtrasadas },
    { count: contratosAtivos },
    { data: proximasVencer },
    { count: recibosNaoEnviados },
    { data: prazosAbertos },
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
      .from("contratos_aluguel")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("cobrancas")
      .select(
        "id, valor_previsto, data_vencimento, status, imoveis_alugados(endereco_completo)"
      )
      .eq("status", "pendente")
      .lte("data_vencimento", limiteSeteDias)
      .order("data_vencimento", { ascending: true })
      .limit(6),
    supabase
      .from("recibos")
      .select("*", { count: "exact", head: true })
      .is("enviado_inquilino_em", null),
    supabase
      .from("prazos_processuais")
      .select("id, data_prazo, concluido")
      .eq("concluido", false),
  ]);

  // Prazos fatais que vencem em até 5 dias ou já venceram (módulo jurídico).
  const prazosFatais = prazosQueExigemAtencao(
    (prazosAbertos ?? []) as { data_prazo: string; concluido: boolean }[],
    hoje
  ).length;

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

  const linhasProximas = (proximasVencer ?? []) as unknown as {
    id: string;
    valor_previsto: number;
    data_vencimento: string;
    status: string;
    imoveis_alugados: { endereco_completo: string } | null;
  }[];

  const urgentes = [
    ...(prazosFatais
      ? [
          {
            label: `${prazosFatais} prazo${prazosFatais > 1 ? "s" : ""} processual${prazosFatais > 1 ? "is" : ""} vencendo ou vencido${prazosFatais > 1 ? "s" : ""}`,
            href: "/admin/juridico",
          },
        ]
      : []),
    ...(cobrancasAtrasadas
      ? [
          {
            label: `${cobrancasAtrasadas} cobrança${cobrancasAtrasadas > 1 ? "s" : ""} atrasada${cobrancasAtrasadas > 1 ? "s" : ""}`,
            href: "/admin/alugueis/cobrancas",
          },
        ]
      : []),
    ...(recibosNaoEnviados
      ? [
          {
            label: `${recibosNaoEnviados} recibo${recibosNaoEnviados > 1 ? "s" : ""} não enviado${recibosNaoEnviados > 1 ? "s" : ""} ao inquilino`,
            href: "/admin/alugueis/recibos",
          },
        ]
      : []),
  ];

  const resumo = [
    {
      titulo: "Receita recebida",
      valor: formatarMoeda(receitaMesPaga),
      href: "/admin/alugueis",
    },
    {
      titulo: "Receita prevista",
      valor: formatarMoeda(receitaMesPrevista),
      href: "/admin/alugueis",
    },
    {
      titulo: "Locações ativas",
      valor: locacoesAtivas ?? 0,
      href: "/admin/alugueis/imoveis-alugados",
    },
    {
      titulo: "Imóveis publicados",
      valor: `${publicados ?? 0} / ${totalImoveis ?? 0}`,
      href: "/admin/imoveis",
    },
    {
      titulo: "Contratos ativos",
      valor: contratosAtivos ?? 0,
      href: "/admin/alugueis/contratos",
    },
    {
      titulo: "Agendamentos pendentes",
      valor: agendamentosPendentes ?? 0,
      href: "/admin/agendamentos",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-graphite">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral da gestão de aluguéis
        </p>
      </div>

      {/* BLOCO 1 — URGENTE (só exibe se houver itens) */}
      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">
            🚨 Urgente
          </p>
          <div className="space-y-2">
            {urgentes.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between bg-white border border-red-100 rounded-xl px-4 py-3 hover:border-red-300 transition-colors"
              >
                <span className="text-sm font-medium text-red-700">
                  {item.label}
                </span>
                <span className="text-xs text-red-400">Ver →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* BLOCO 2 — VENCE EM 7 DIAS */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">
            ⏰ Vence em 7 dias
          </p>
          <Link
            href="/admin/alugueis/cobrancas"
            className="text-xs font-medium text-yellow-700 hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {linhasProximas.length > 0 ? (
          <div className="space-y-2">
            {linhasProximas.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-white border border-yellow-100 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-graphite">
                    {c.imoveis_alugados?.endereco_completo ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Venc.{" "}
                    {new Date(c.data_vencimento).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
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
          <p className="text-sm text-yellow-700/60 py-4 text-center">
            Nenhuma cobrança vencendo nos próximos 7 dias.
          </p>
        )}
      </div>

      {/* BLOCO 3 — AÇÕES RÁPIDAS */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Ações rápidas
        </p>
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
            + Nova locação
          </Link>
          <Link
            href="/admin/alugueis/pagamentos"
            className="bg-graphite text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Registrar pagamento
          </Link>
          <Link
            href="/admin/alugueis/cobrancas"
            className="border border-gray-300 text-graphite text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver cobranças
          </Link>
        </div>
      </div>

      {/* BLOCO 4 — RESUMO DO MÊS */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Resumo do mês
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {resumo.map((s) => (
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
    </div>
  );
}
