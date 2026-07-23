import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type AgendamentoLinha = {
  id: string;
  data_hora: string;
  status: string;
  observacoes: string | null;
  imoveis: { titulo: string } | null;
  clientes: { usuarios: { nome: string; whatsapp: string | null } | null } | null;
};

const ROTULOS_STATUS: Record<string, string> = {
  solicitado: "Solicitado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  remarcado: "Remarcado",
};

const CORES_STATUS: Record<string, string> = {
  solicitado: "bg-warning/10 text-warning",
  confirmado: "bg-success/10 text-success",
  realizado: "bg-primary/10 text-primary",
  cancelado: "bg-gray-100 text-gray-500",
  remarcado: "bg-warning/10 text-warning",
};

export default async function AdminAgendamentosPage() {
  const supabase = criarClienteSupabaseServidor();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      "id, data_hora, status, observacoes, imoveis(titulo), clientes(usuarios(nome, whatsapp))"
    )
    .order("data_hora", { ascending: false });

  const linhas = (agendamentos ?? []) as unknown as AgendamentoLinha[];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Agendamentos
      </h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Imóvel</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((ag) => (
                  <tr key={ag.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-graphite">
                      {new Date(ag.data_hora).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ag.imoveis?.titulo ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ag.clientes?.usuarios?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ag.clientes?.usuarios?.whatsapp ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          CORES_STATUS[ag.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROTULOS_STATUS[ag.status] ?? ag.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {ag.observacoes ?? "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum agendamento ainda.
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
