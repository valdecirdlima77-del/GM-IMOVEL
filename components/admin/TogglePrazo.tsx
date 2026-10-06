"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TogglePrazo({ prazoId, concluido }: { prazoId: string; concluido: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar() {
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/juridico/prazos/${prazoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido: !concluido }),
      });
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        setErro(corpo.erro ?? "Não foi possível atualizar o prazo.");
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
        onClick={alternar}
        disabled={enviando}
        className="text-xs font-medium border border-gray-300 text-graphite px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando…" : concluido ? "Reabrir" : "Marcar como cumprido"}
      </button>
      {erro && <span className="text-xs text-red-600 mt-1">{erro}</span>}
    </div>
  );
}
