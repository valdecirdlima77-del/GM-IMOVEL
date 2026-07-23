import { notFound } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import FormularioImovelAlugado from "@/components/admin/FormularioImovelAlugado";

type Props = { params: { id: string } };

export default async function EditarLocacaoPage({ params }: Props) {
  const supabase = criarClienteSupabaseServidor();
  const [{ data: locacao }, { data: proprietarios }, { data: inquilinos }] = await Promise.all([
    supabase.from("imoveis_alugados").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("proprietarios").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("inquilinos").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  if (!locacao) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Editar locação
      </h1>
      <FormularioImovelAlugado
        locacaoId={params.id}
        proprietarios={proprietarios ?? []}
        inquilinos={inquilinos ?? []}
        valoresIniciais={{
          proprietario_id: locacao.proprietario_id ?? "",
          inquilino_id: locacao.inquilino_id ?? "",
          endereco_completo: locacao.endereco_completo ?? "",
          valor_aluguel: String(locacao.valor_aluguel ?? ""),
          dia_vencimento: String(locacao.dia_vencimento ?? 5),
          status: locacao.status ?? "ativo",
          data_inicio: locacao.data_inicio ?? "",
          data_fim: locacao.data_fim ?? "",
        }}
      />
    </div>
  );
}
