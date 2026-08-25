import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import FormularioDespesa, { DESPESA_VAZIA } from "@/components/admin/FormularioDespesa";

export default async function NovaDespesaPage() {
  const supabase = criarClienteSupabaseAdmin();
  const { data: imoveis } = await supabase
    .from("imoveis_alugados")
    .select("id, endereco_completo")
    .order("endereco_completo", { ascending: true });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">Nova despesa</h1>
      <FormularioDespesa valoresIniciais={DESPESA_VAZIA} imoveis={imoveis ?? []} />
    </div>
  );
}
