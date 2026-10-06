import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { formatarData } from "@/lib/formatadores";
import { prazosQueExigemAtencao, situacaoPrazo, SituacaoPrazo } from "@/lib/juridico/prazos";
import { hojeNoEscritorio } from "@/lib/datas";

// Sem isso, o Next.js cacheia a primeira resposta do Supabase e a lista para
// de refletir processos e prazos novos.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_VALIDOS = ["ativo", "encerrado", "suspenso", "arquivado"] as const;

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "ativo", rotulo: "Ativos" },
  { valor: "suspenso", rotulo: "Suspensos" },
  { valor: "encerrado", rotulo: "Encerrados" },
  { valor: "arquivado", rotulo: "Arquivados" },
];

const ROTULO_SITUACAO: Record<SituacaoPrazo, { texto: string; classe: string }> = {
  vencido: { texto: "Vencido", classe: "bg-red-100 text-red-700" },
  urgente: { texto: "Vence em até 5 dias", classe: "bg-yellow-100 text-yellow-800" },
  proximo: { texto: "Próximo", classe: "bg-gray-100 text-gray-700" },
  no_prazo: { texto: "No prazo", classe: "bg-gray-100 text-gray-500" },
  concluido: { texto: "Concluído", classe: "bg-success/10 text-success" },
};

type ProcessoLinha = {
  id: string;
  numero_processo: string | null;
  tipo: string;
  status: string;
  vara: string | null;
  comarca: string | null;
};

type PrazoLinha = {
  id: string;
  processo_id: string;
  descricao: string;
  data_prazo: string;
  concluido: boolean;
};

export default async function JuridicoPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const status = searchParams.status ?? "";
  const hoje = hojeNoEscritorio();

  const supabase = criarClienteSupabaseAdmin();
  let consultaProcessos = supabase
    .from("processos_juridicos")
    .select("id, numero_processo, tipo, status, vara, comarca")
    .order("criado_em", { ascending: false });
  if (status && (STATUS_VALIDOS as readonly string[]).includes(status)) {
    consultaProcessos = consultaProcessos.eq("status", status);
  }

  const [{ data: processos }, { data: prazos }] = await Promise.all([
    consultaProcessos,
    supabase
      .from("prazos_processuais")
      .select("id, processo_id, descricao, data_prazo, concluido")
      .eq("concluido", false)
      .order("data_prazo", { ascending: true }),
  ]);

  const listaProcessos = (processos ?? []) as ProcessoLinha[];
  const listaPrazos = (prazos ?? []) as PrazoLinha[];
  const prazosAtencao = prazosQueExigemAtencao(listaPrazos, hoje);

  const processoPorId = new Map(listaProcessos.map((p) => [p.id, p]));
  const proximoPrazoDoProcesso = new Map<string, PrazoLinha>();
  for (const prazo of listaPrazos) {
    if (!proximoPrazoDoProcesso.has(prazo.processo_id)) {
      proximoPrazoDoProcesso.set(prazo.processo_id, prazo);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-graphite">Jurídico</h1>
          <p className="text-sm text-gray-500 mt-1">Processos e prazos processuais</p>
        </div>
        <Link
          href="/admin/juridico/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Novo processo
        </Link>
      </div>

      {prazosAtencao.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">
            Prazos que exigem atenção ({prazosAtencao.length})
          </p>
          <div className="space-y-2">
            {prazosAtencao.map((p) => {
              const processo = processoPorId.get(p.processo_id);
              const situacao = situacaoPrazo(p, hoje);
              return (
                <Link
                  key={p.id}
                  href={`/admin/juridico/${p.processo_id}`}
                  className="flex items-center justify-between bg-white border border-red-100 rounded-xl px-4 py-3 hover:border-red-300"
                >
                  <div>
                    <p className="text-sm font-medium text-graphite">{p.descricao}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {processo?.numero_processo ?? processo?.tipo ?? "Processo"} · fatal {formatarData(p.data_prazo)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${ROTULO_SITUACAO[situacao].classe}`}>
                    {ROTULO_SITUACAO[situacao].texto}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.rotulo}
            href={f.valor ? `/admin/juridico?status=${f.valor}` : "/admin/juridico"}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              status === f.valor
                ? "bg-graphite text-white border-graphite"
                : "bg-white text-graphite border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Processo</th>
                <th className="px-4 py-3 font-medium">Vara / Comarca</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Próximo prazo</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {listaProcessos.length > 0 ? (
                listaProcessos.map((p) => {
                  const proximo = proximoPrazoDoProcesso.get(p.id);
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <p className="text-graphite font-medium">{p.tipo}</p>
                        <p className="text-xs text-gray-500">{p.numero_processo ?? "Sem número"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {[p.vara, p.comarca].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.status}</td>
                      <td className="px-4 py-3">
                        {proximo ? (
                          <span className="text-gray-600">
                            {formatarData(proximo.data_prazo)} · {proximo.descricao}
                          </span>
                        ) : (
                          <span className="text-gray-400">Nenhum em aberto</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/juridico/${p.id}`} className="text-primary hover:underline font-medium">
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nenhum processo cadastrado ainda.
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
