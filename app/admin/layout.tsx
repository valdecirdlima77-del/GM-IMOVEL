import Link from "next/link";
import { ReactNode } from "react";

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
            href="/"
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors mt-2 text-white/60"
          >
            Voltar ao site
          </Link>
        </nav>
      </aside>

      <main className="flex-1 bg-offwhite min-h-screen p-6">{children}</main>
    </div>
  );
}
