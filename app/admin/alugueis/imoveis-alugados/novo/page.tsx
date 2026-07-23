import { criarClienteSupabaseServidor } from "@/lib/supabase/server";
import FormularioImovelAlugado, {
  IMOVEL_ALUGADO_VAZIO,
} from "@/components/admin/FormularioImovelAlugado";

export default async function NovaLocacaoPage() {
  const supabase = criarClienteSupabaseServidor();
  const [{ data: proprietarios }, { data: inquilinos }] = await Promise.all([
    supabase.from("proprietarios").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("inquilinos").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Nova locação
      </h1>
      <FormularioImovelAlugado
        valoresIniciais={IMOVEL_ALUGADO_VAZIO}
        proprietarios={proprietarios ?? []}
        inquilinos={inquilinos ?? []}
      />
    </div>
  );
}
