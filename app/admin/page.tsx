import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = criarClienteSupabaseServidor();

  const [
    { count: totalImoveis },
    { count: publicados },
    { count: rascunhos },
    { count: agendamentosPendentes },
  ] = await Promise.all([
    supabase.from("imoveis").select("*", { count: "exact", head: true }),
    supabase
      .from("imoveis")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado"),
    supabase
      .from("imoveis")
      .select("*", { count: "exact", head: true })
      .eq("status", "rascunho"),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "solicitado"),
  ]);

  const cartoes = [
    { titulo: "Total de imóveis", valor: totalImoveis ?? 0 },
    { titulo: "Publicados", valor: publicados ?? 0 },
    { titulo: "Rascunhos", valor: rascunhos ?? 0 },
    { titulo: "Agendamentos pendentes", valor: agendamentosPendentes ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cartoes.map((cartao) => (
          <div
            key={cartao.titulo}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">{cartao.titulo}</p>
            <p className="font-heading text-3xl font-bold text-graphite mt-1">
              {cartao.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/imoveis"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Gerenciar imóveis
        </Link>
        <Link
          href="/admin/imoveis/novo"
          className="bg-secondary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Cadastrar novo imóvel
        </Link>
      </div>
    </div>
  );
}
