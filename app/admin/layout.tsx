import Link from "next/link";
import { ReactNode } from "react";
import BotaoLogout from "@/components/admin/BotaoLogout";

type AdminLayoutProps = {
  children: ReactNode;
};

const GRUPOS = [
  {
    titulo: "Geral",
    itens: [
      { href: "/admin", label: "Dashboard", icone: "📊" },
      { href: "/admin/imoveis", label: "Imóveis", icone: "🏠" },
      { href: "/admin/agendamentos", label: "Agendamentos", icone: "📅" },
    ],
  },
  {
    titulo: "Aluguéis",
    itens: [
      { href: "/admin/alugueis", label: "Visão geral", icone: "📈" },
      { href: "/admin/alugueis/contratos", label: "Contratos", icone: "📄" },
      { href: "/admin/alugueis/cobrancas", label: "Cobranças", icone: "💰" },
      { href: "/admin/alugueis/pagamentos", label: "Pagamentos", icone: "💳" },
      { href: "/admin/alugueis/recibos", label: "Recibos", icone: "🧾" },
      { href: "/admin/alugueis/imoveis-alugados", label: "Imóveis alugados", icone: "🔑" },
      { href: "/admin/alugueis/proprietarios", label: "Proprietários", icone: "👤" },
      { href: "/admin/alugueis/inquilinos", label: "Inquilinos", icone: "🧑" },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-offwhite">
      <aside className="bg-graphite text-white w-full md:w-64 md:min-h-screen flex-shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
            style={{ background: "#B8860B" }}
          >
            GM
          </div>
          <Link href="/admin" className="font-heading text-lg font-bold">
            GM Admin
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-4 text-sm overflow-y-auto">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="text-xs uppercase text-white/40 font-semibold px-3 mb-1">
                {grupo.titulo}
              </p>
              <div className="space-y-0.5">
                {grupo.itens.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-base">{item.icone}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-white/10 pt-3 space-y-0.5">
            <Link
              href="/admin/configurar"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 text-xs"
            >
              <span>⚙️</span>
              <span>Configurar sistema</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 text-xs"
            >
              <span>←</span>
              <span>Voltar ao site</span>
            </Link>
            <BotaoLogout />
          </div>
        </nav>
      </aside>

      <main className="flex-1 min-h-screen p-6 md:p-8">{children}</main>
    </div>
  );
}
