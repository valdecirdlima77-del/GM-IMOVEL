import { notFound } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import FormularioInquilino from "@/components/admin/FormularioInquilino";

type Props = { params: { id: string } };

export default async function EditarInquilinoPage({ params }: Props) {
  const supabase = criarClienteSupabaseServidor();
  const { data: inquilino } = await supabase
    .from("inquilinos")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!inquilino) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Editar inquilino
      </h1>
      <FormularioInquilino
        inquilinoId={params.id}
        valoresIniciais={{
          nome: inquilino.nome ?? "",
          cpf: inquilino.cpf ?? "",
          rg: inquilino.rg ?? "",
          email: inquilino.email ?? "",
          telefone: inquilino.telefone ?? "",
          whatsapp: inquilino.whatsapp ?? "",
          comprovante_renda_url: inquilino.comprovante_renda_url ?? "",
          renda_declarada: inquilino.renda_declarada ? String(inquilino.renda_declarada) : "",
          fiador_nome: inquilino.fiador_nome ?? "",
          fiador_telefone: inquilino.fiador_telefone ?? "",
          observacoes: inquilino.observacoes ?? "",
          ativo: inquilino.ativo ?? true,
        }}
      />
    </div>
  );
}
