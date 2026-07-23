import { notFound } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import FormularioProprietario from "@/components/admin/FormularioProprietario";

type Props = { params: { id: string } };

export default async function EditarProprietarioPage({ params }: Props) {
  const supabase = criarClienteSupabaseServidor();
  const { data: proprietario } = await supabase
    .from("proprietarios")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!proprietario) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Editar proprietário
      </h1>
      <FormularioProprietario
        proprietarioId={params.id}
        valoresIniciais={{
          nome: proprietario.nome ?? "",
          cpf_cnpj: proprietario.cpf_cnpj ?? "",
          email: proprietario.email ?? "",
          telefone: proprietario.telefone ?? "",
          banco: proprietario.banco ?? "",
          agencia: proprietario.agencia ?? "",
          conta: proprietario.conta ?? "",
          tipo_conta: proprietario.tipo_conta ?? "pix",
          chave_pix: proprietario.chave_pix ?? "",
          comissao_percentual: String(proprietario.comissao_percentual ?? 10),
          observacoes: proprietario.observacoes ?? "",
          ativo: proprietario.ativo ?? true,
        }}
      />
    </div>
  );
}
