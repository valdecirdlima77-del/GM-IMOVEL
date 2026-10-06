import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { formatarMoeda } from "@/lib/formatadores";
import {
  deslocarCompetencia,
  parseCompetencia,
  rotuloCompetencia,
} from "@/lib/financeiro/competencia";
import { hojeNoEscritorio } from "@/lib/datas";
import GerarRepasses from "@/components/admin/GerarRepasses";
import AvancarRepasse from "@/components/admin/AvancarRepasse";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  calculado: { texto: "Calculado", classe: "bg-gray-100 text-gray-700" },
  confirmado: { texto: "Confirmado", classe: "bg-warning/10 text-warning" },
  pago: { texto: "Pago", classe: "bg-success/10 text-success" },
};

type RepasseLinha = {
  id: string;
  valor_bruto: number;
  taxa_administracao: number;
  total_despesas: number;
  valor_liquido: number;
  status: string;
  data_repasse: string | null;
  proprietarios: { nome: string } | null;
};

export default async function RepassesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const competenciaPadrao = parseCompetencia(hojeNoEscritorio()) as string;
  const competencia = parseCompetencia(searchParams.competencia) ?? competenciaPadrao;

  const supabase = criarClienteSupabaseAdmin();
  const { data } = await supabase
    .from("repasses")
    .select("id, valor_bruto, taxa_administracao, total_despesas, valor_liquido, status, data_repasse, proprietarios(nome)")
    .eq("competencia", competencia)
    .order("criado_em", { ascending: true });

  const linhas = (data ?? []) as unknown as RepasseLinha[];
  const totalLiquido = linhas.reduce((s, r) => s + Number(r.valor_liquido), 0);
  const pendentes = linhas.filter((r) => r.status !== "pago").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-graphite">Repasses aos proprietários</h2>
          <p className="text-sm text-gray-500 mt-1">
            Aluguéis recebidos menos taxa de administração e despesas repassáveis
          </p>
        </div>
        <GerarRepasses competencia={competencia} />
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
        <Link
          href={`/admin/alugueis/repasses?competencia=${deslocarCompetencia(competencia, -1)}`}
          className="text-sm font-medium text-graphite hover:text-primary"
        >
          ← Mês anterior
        </Link>
        <span className="font-heading font-bold text-graphite">{rotuloCompetencia(competencia)}</span>
        <Link
          href={`/admin/alugueis/repasses?competencia=${deslocarCompetencia(competencia, 1)}`}
          className="text-sm font-medium text-graphite hover:text-primary"
        >
          Próximo mês →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Repasses do mês</p>
          <p className="font-heading text-lg font-bold text-graphite mt-1">{linhas.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Ainda a pagar</p>
          <p className="font-heading text-lg font-bold text-graphite mt-1">{pendentes}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total líquido</p>
          <p className="font-heading text-lg font-bold text-graphite mt-1">{formatarMoeda(totalLiquido)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium text-right">Bruto</th>
                <th className="px-4 py-3 font-medium text-right">Taxa</th>
                <th className="px-4 py-3 font-medium text-right">Despesas</th>
                <th className="px-4 py-3 font-medium text-right">Líquido</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((r) => {
                  const st = ROTULO_STATUS[r.status] ?? ROTULO_STATUS.calculado;
                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-graphite font-medium">{r.proprietarios?.nome ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatarMoeda(Number(r.valor_bruto))}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatarMoeda(Number(r.taxa_administracao))}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatarMoeda(Number(r.total_despesas))}</td>
                      <td className="px-4 py-3 text-right text-graphite font-bold">{formatarMoeda(Number(r.valor_liquido))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${st.classe}`}>{st.texto}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AvancarRepasse repasseId={r.id} statusAtual={r.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhum repasse gerado para este mês. Use “Gerar repasses” quando as cobranças estiverem pagas.
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
