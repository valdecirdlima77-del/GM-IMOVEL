"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Próxima etapa do repasse: calculado -> confirmado -> pago.
const PROXIMO: Record<string, { status: string; rotulo: string } | undefined> = {
  calculado: { status: "confirmado", rotulo: "Confirmar" },
  confirmado: { status: "pago", rotulo: "Marcar como pago" },
};

export default function AvancarRepasse({ repasseId, statusAtual }: { repasseId: string; statusAtual: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const proximo = PROXIMO[statusAtual];

  if (!proximo) return <span className="text-xs text-gray-400">Concluído</span>;

  async function avancar() {
    if (!proximo) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/repasses/${repasseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: proximo.status }),
      });
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        setErro(corpo.erro ?? "Não foi possível atualizar o repasse.");
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
      <button
        type="button"
        onClick={avancar}
        disabled={enviando}
        className="text-xs font-medium border border-gray-300 text-graphite px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando…" : proximo.rotulo}
      </button>
      {erro && <span className="text-xs text-red-600 mt-1">{erro}</span>}
    </div>
  );
}
