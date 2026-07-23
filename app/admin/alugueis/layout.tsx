import Link from "next/link";
import { ReactNode } from "react";

const ABAS = [
  { href: "/admin/alugueis", rotulo: "Visão geral" },
  { href: "/admin/alugueis/proprietarios", rotulo: "Proprietários" },
  { href: "/admin/alugueis/inquilinos", rotulo: "Inquilinos" },
  { href: "/admin/alugueis/imoveis-alugados", rotulo: "Imóveis alugados" },
  { href: "/admin/alugueis/cobrancas", rotulo: "Cobranças" },
  { href: "/admin/alugueis/pagamentos", rotulo: "Pagamentos" },
  { href: "/admin/alugueis/recibos", rotulo: "Recibos" },
];

export default function AlugueisLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        {ABAS.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {aba.rotulo}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
