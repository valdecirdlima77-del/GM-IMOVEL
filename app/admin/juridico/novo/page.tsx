import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import NovoProcessoForm from "@/components/admin/NovoProcessoForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NovoProcessoPage() {
  const supabase = criarClienteSupabaseAdmin();
  const { data: clientes } = await supabase
    .from("clientes_unificados")
    .select("id, nome")
    .order("nome", { ascending: true });

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/admin/juridico" className="text-sm text-gray-500 hover:text-primary">
        ← Voltar aos processos
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold text-graphite">Novo processo</h1>
        <p className="text-sm text-gray-500 mt-1">Depois de salvar, você adiciona os prazos.</p>
      </div>
      <NovoProcessoForm clientes={clientes ?? []} />
    </div>
  );
}
