import Link from "next/link";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type InquilinoLinha = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  ativo: boolean;
};

export default async function InquilinosPage() {
  const supabase = criarClienteSupabaseServidor();
  const { data: inquilinos } = await supabase
    .from("inquilinos")
    .select("id, nome, telefone, email, cpf, ativo")
    .order("nome", { ascending: true });

  const linhas = (inquilinos ?? []) as InquilinoLinha[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-graphite">Inquilinos</h1>
        <Link
          href="/admin/alugueis/inquilinos/novo"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Novo inquilino
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite font-medium">{i.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{i.cpf ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{i.telefone}</td>
                    <td className="px-4 py-3 text-gray-600">{i.email ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          i.ativo ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {i.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/alugueis/inquilinos/${i.id}/editar`}
                        className="text-primary hover:underline font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhum inquilino cadastrado ainda.
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
