"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPCOES = [
  { valor: "ativo", rotulo: "Ativo" },
  { valor: "suspenso", rotulo: "Suspenso" },
  { valor: "encerrado", rotulo: "Encerrado" },
  { valor: "arquivado", rotulo: "Arquivado" },
];

export default function StatusProcesso({ processoId, statusAtual }: { processoId: string; statusAtual: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function mudar(novo: string) {
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/juridico/processos/${processoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novo }),
      });
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        setErro(corpo.erro ?? "Não foi possível alterar o status.");
        return;
      }
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <label className="text-xs font-medium text-gray-600 mb-1">Status do processo</label>
      <select
        value={statusAtual}
        disabled={enviando}
        onChange={(e) => mudar(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-graphite focus:outline-none focus:border-primary"
      >
        {OPCOES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {erro && <span className="text-xs text-red-600 mt-1">{erro}</span>}
    </div>
  );
}
