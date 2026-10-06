"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Busca com debounce: espera a Geisa parar de digitar por 300 ms antes de
// atualizar a URL, o que refaz a consulta no servidor.
export default function BuscaClientes({ valorInicial }: { valorInicial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const [valor, setValor] = useState(valorInicial);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nova = new URLSearchParams(parametros.toString());
      if (valor.trim()) nova.set("q", valor.trim());
      else nova.delete("q");
      nova.delete("pagina");
      router.replace(`${pathname}?${nova.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <input
      type="search"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      placeholder="Buscar por nome, CPF/CNPJ ou telefone"
      className="w-full sm:w-80 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-graphite focus:outline-none focus:border-primary"
    />
  );
}
