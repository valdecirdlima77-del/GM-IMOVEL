import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import BuscaClientes from "@/components/admin/BuscaClientes";
import NovoClienteModal from "@/components/admin/NovoClienteModal";

// Sem isso, o Next.js cacheia a primeira resposta do Supabase e a lista para
// de refletir cadastros novos (mesmo ajuste de app/admin/alugueis/inquilinos).
export const dynamic = "force-dynamic";
export const revalidate = 0;

const POR_PAGINA = 20;

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "inquilino", rotulo: "Locatário" },
  { valor: "proprietario", rotulo: "Proprietário" },
  { valor: "cliente_advocacia", rotulo: "Advocacia" },
  { valor: "lead", rotulo: "Lead" },
];

const ROTULO_TIPO: Record<string, string> = {
  inquilino: "Locatário",
  proprietario: "Proprietário",
  cliente_advocacia: "Advocacia",
  lead: "Lead",
};

type ClienteLinha = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  tipo: string;
};

// wa.me exige o número só com dígitos, com DDI 55 para celular brasileiro.
function linkWhatsApp(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const completo = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${completo}`;
}

function montarHref(params: Record<string, string>): string {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return qs ? `/admin/clientes?${qs}` : "/admin/clientes";
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const q = (searchParams.q ?? "").trim();
  const tipo = searchParams.tipo ?? "";
  const pagina = Math.max(1, Number(searchParams.pagina ?? 1) || 1);
  const inicio = (pagina - 1) * POR_PAGINA;

  const supabase = criarClienteSupabaseAdmin();
  let consulta = supabase
    .from("clientes_unificados")
    .select("id, nome, cpf_cnpj, email, telefone, tipo", { count: "exact" })
    .order("nome", { ascending: true })
    .range(inicio, inicio + POR_PAGINA - 1);

  // Mesmo tratamento do endpoint /api/clientes: remove caracteres do filtro.
  const seguro = q.replace(/[,()%_*\\]/g, " ").trim();
  if (seguro) {
    consulta = consulta.or(
      `nome.ilike.%${seguro}%,cpf_cnpj.ilike.%${seguro}%,telefone.ilike.%${seguro}%`
    );
  }
  if (tipo && ROTULO_TIPO[tipo]) {
    consulta = consulta.eq("tipo", tipo);
  }

  const { data, count } = await consulta;
  const linhas = (data ?? []) as ClienteLinha[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const paramsBase = { q, tipo };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-graphite">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Locatários, proprietários, clientes de advocacia e leads em um só lugar
          </p>
        </div>
        <NovoClienteModal />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <BuscaClientes valorInicial={q} />
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const ativo = tipo === f.valor;
            return (
              <Link
                key={f.rotulo}
                href={montarHref({ ...paramsBase, tipo: f.valor })}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  ativo
                    ? "bg-graphite text-white border-graphite"
                    : "bg-white text-graphite border-gray-300 hover:bg-gray-50"
                }`}
              >
                {f.rotulo}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">CPF / CNPJ</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.length > 0 ? (
                linhas.map((c) => {
                  const wa = c.telefone ? linkWhatsApp(c.telefone) : null;
                  return (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-graphite font-medium">{c.nome}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                          {ROTULO_TIPO[c.tipo] ?? c.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.cpf_cnpj ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{c.telefone ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-success hover:underline font-medium"
                          >
                            WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    {q || tipo
                      ? "Nenhum cliente encontrado com esses filtros."
                      : "Nenhum cliente cadastrado ainda."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Página {pagina} de {totalPaginas} · {total} cliente{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Link
                href={montarHref({ ...paramsBase, pagina: String(pagina - 1) })}
                className="border border-gray-300 text-graphite px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                ← Anterior
              </Link>
            )}
            {pagina < totalPaginas && (
              <Link
                href={montarHref({ ...paramsBase, pagina: String(pagina + 1) })}
                className="border border-gray-300 text-graphite px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
