import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import { formatarData } from "@/lib/formatadores";
import { situacaoPrazo, SituacaoPrazo } from "@/lib/juridico/prazos";
import { hojeNoEscritorio } from "@/lib/datas";
import NovoPrazo from "@/components/admin/NovoPrazo";
import TogglePrazo from "@/components/admin/TogglePrazo";
import StatusProcesso from "@/components/admin/StatusProcesso";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROTULO_SITUACAO: Record<SituacaoPrazo, { texto: string; classe: string }> = {
  vencido: { texto: "Vencido", classe: "bg-red-100 text-red-700" },
  urgente: { texto: "Vence em até 5 dias", classe: "bg-yellow-100 text-yellow-800" },
  proximo: { texto: "Próximo", classe: "bg-gray-100 text-gray-700" },
  no_prazo: { texto: "No prazo", classe: "bg-gray-100 text-gray-500" },
  concluido: { texto: "Concluído", classe: "bg-success/10 text-success" },
};

export default async function ProcessoDetalhePage({ params }: { params: { id: string } }) {
  const hoje = hojeNoEscritorio();
  const supabase = criarClienteSupabaseAdmin();

  const [{ data: processo }, { data: prazos }] = await Promise.all([
    supabase
      .from("processos_juridicos")
      .select("id, numero_processo, tipo, descricao, status, vara, comarca, data_distribuicao")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("prazos_processuais")
      .select("id, descricao, data_prazo, concluido, data_conclusao")
      .eq("processo_id", params.id)
      .order("data_prazo", { ascending: true }),
  ]);

  if (!processo) notFound();

  const linhas = (prazos ?? []) as {
    id: string;
    descricao: string;
    data_prazo: string;
    concluido: boolean;
    data_conclusao: string | null;
  }[];

  return (
    <div className="space-y-6">
      <Link href="/admin/juridico" className="text-sm text-gray-500 hover:text-primary">
        ← Voltar aos processos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-graphite">{processo.tipo}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {processo.numero_processo ?? "Sem número de processo"}
            {processo.vara ? ` · ${processo.vara}` : ""}
            {processo.comarca ? ` · ${processo.comarca}` : ""}
          </p>
          {processo.data_distribuicao && (
            <p className="text-sm text-gray-500">Distribuído em {formatarData(processo.data_distribuicao)}</p>
          )}
          {processo.descricao && <p className="text-sm text-gray-700 mt-3 max-w-2xl">{processo.descricao}</p>}
        </div>
        <StatusProcesso processoId={processo.id} statusAtual={processo.status} />
      </div>

      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Prazos</h2>
        <NovoPrazo processoId={processo.id} />
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-4">
          {linhas.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {linhas.map((p) => {
                const situacao = situacaoPrazo(p, hoje);
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className={`text-sm font-medium ${p.concluido ? "text-gray-400 line-through" : "text-graphite"}`}>
                        {p.descricao}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fatal {formatarData(p.data_prazo)}
                        {p.concluido && p.data_conclusao ? ` · cumprido em ${formatarData(p.data_conclusao)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${ROTULO_SITUACAO[situacao].classe}`}>
                        {ROTULO_SITUACAO[situacao].texto}
                      </span>
                      <TogglePrazo prazoId={p.id} concluido={p.concluido} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-gray-500 text-sm">Nenhum prazo cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
