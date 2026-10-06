import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { formatarData, formatarMoeda } from "@/lib/formatadores";
import {
  deslocarCompetencia,
  intervaloCompetencia,
  parseCompetencia,
  rotuloCompetencia,
} from "@/lib/financeiro/competencia";
import NovaReceitaModal from "@/components/admin/NovaReceitaModal";
import { hojeNoEscritorio } from "@/lib/datas";

// Sem isso, o Next.js cacheia a primeira resposta do Supabase e a tela para de
// refletir lançamentos novos (mesmo ajuste das demais telas do admin).
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReceitaLinha = {
  id: string;
  descricao: string;
  valor: number;
  data_receita: string;
  categoria: string | null;
};

type DespesaLinha = {
  id: string;
  descricao: string;
  valor: number;
  competencia: string;
  tipo: string;
  imoveis_alugados: { endereco_completo: string } | null;
};

const ROTULO_TIPO_DESPESA: Record<string, string> = {
  manutencao: "Manutenção",
  reparo: "Reparo",
  taxa: "Taxa",
  iptu: "IPTU",
  condominio: "Condomínio",
  outra: "Outra",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const competenciaPadrao = parseCompetencia(hojeNoEscritorio()) as string;
  const competencia = parseCompetencia(searchParams.competencia) ?? competenciaPadrao;
  const { inicio, fim } = intervaloCompetencia(competencia);

  const supabase = criarClienteSupabaseAdmin();
  const [{ data: receitas }, { data: despesas }] = await Promise.all([
    supabase
      .from("receitas")
      .select("id, descricao, valor, data_receita, categoria")
      .gte("data_receita", inicio)
      .lte("data_receita", fim)
      .order("data_receita", { ascending: true }),
    supabase
      .from("despesas")
      .select("id, descricao, valor, competencia, tipo, imoveis_alugados(endereco_completo)")
      .eq("competencia", competencia)
      .order("competencia", { ascending: true }),
  ]);

  const listaReceitas = (receitas ?? []) as ReceitaLinha[];
  const listaDespesas = (despesas ?? []) as unknown as DespesaLinha[];
  const totalReceitas = listaReceitas.reduce((s, r) => s + Number(r.valor), 0);
  const totalDespesas = listaDespesas.reduce((s, d) => s + Number(d.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const anterior = deslocarCompetencia(competencia, -1);
  const proxima = deslocarCompetencia(competencia, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-graphite">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Receitas e despesas do mês</p>
        </div>
        <NovaReceitaModal dataPadrao={inicio} />
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
        <Link href={`/admin/financeiro?competencia=${anterior}`} className="text-sm font-medium text-graphite hover:text-primary">
          ← Mês anterior
        </Link>
        <span className="font-heading font-bold text-graphite">{rotuloCompetencia(competencia)}</span>
        <Link href={`/admin/financeiro?competencia=${proxima}`} className="text-sm font-medium text-graphite hover:text-primary">
          Próximo mês →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Receitas</p>
          <p className="font-heading text-lg font-bold text-success mt-1">{formatarMoeda(totalReceitas)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Despesas dos imóveis</p>
          <p className="font-heading text-lg font-bold text-graphite mt-1">{formatarMoeda(totalDespesas)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className={`font-heading text-lg font-bold mt-1 ${saldo < 0 ? "text-danger" : "text-graphite"}`}>
            {formatarMoeda(saldo)}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Receitas</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {listaReceitas.length > 0 ? (
                  listaReceitas.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-600">{formatarData(r.data_receita)}</td>
                      <td className="px-4 py-3 text-graphite font-medium">{r.descricao}</td>
                      <td className="px-4 py-3 text-gray-600">{r.categoria ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-graphite">{formatarMoeda(Number(r.valor))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Nenhuma receita lançada neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Despesas dos imóveis alugados (somente leitura)
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Imóvel</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {listaDespesas.length > 0 ? (
                  listaDespesas.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-600">{d.imoveis_alugados?.endereco_completo ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{ROTULO_TIPO_DESPESA[d.tipo] ?? d.tipo}</td>
                      <td className="px-4 py-3 text-graphite">{d.descricao}</td>
                      <td className="px-4 py-3 text-right text-graphite">{formatarMoeda(Number(d.valor))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Nenhuma despesa de imóvel neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
