import Link from "next/link";
import { ReactNode } from "react";
import BotaoLogout from "@/components/admin/BotaoLogout";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="bg-graphite text-white w-full md:w-60 md:min-h-screen flex-shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="font-heading text-lg font-bold">
            GM Admin
          </Link>
        </div>
        <nav className="flex md:flex-col p-3 gap-1 text-sm">
          <Link
            href="/admin"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/imoveis"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Imóveis
          </Link>
          <Link
            href="/admin/agendamentos"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Agendamentos
          </Link>
          <Link
            href="/admin/alugueis"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Aluguéis
          </Link>
          <Link
            href="/admin/configurar"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors mt-4 text-white/40 text-xs"
          >
            ⚙️ Configurar sistema
          </Link>
          <Link
            href="/"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 text-xs"
          >
            ← Voltar ao site
          </Link>
          <BotaoLogout />
        </nav>
      </aside>

      <main className="flex-1 bg-offwhite min-h-screen p-6">{children}</main>
    </div>
  );
}
