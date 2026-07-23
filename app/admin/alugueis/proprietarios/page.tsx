import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type ProprietarioLinha = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  banco: string | null;
  comissao_percentual: number;
  ativo: boolean;
};

export default async function ProprietariosPage() {
  const supabase = criarClienteSupabaseServidor();
  const { data: proprietarios } = await supabase
    .from("proprietarios")
    .select("id, nome, telefone, email, banco, comissao_percentual, ativo")
    .order("nome", { ascending: true });

  const linhas = (proprietarios ?? []) as ProprietarioLinha[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-graphite">
          Proprietários
        </h1>
        <Link
          href="/admin/alugueis/proprietarios/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Novo proprietário
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Banco</th>
                <th className="px-4 py-3 font-medium">Comissão</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">{p.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{p.telefone}</td>
                    <td className="px-4 py-3 text-gray-600">{p.email ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.banco ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.comissao_percentual}%</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          p.ativo ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/alugueis/proprietarios/${p.id}/editar`}
                        className="text-primary hover:underline font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Nenhum proprietário cadastrado ainda.
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
