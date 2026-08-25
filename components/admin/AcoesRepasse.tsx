"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  repasseId: string;
  status: string;
  demonstrativoUrl: string | null;
};

export default function AcoesRepasse({ repasseId, status, demonstrativoUrl }: Props) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function gerarDemonstrativo() {
    setEnviando(true);
    await fetch(`/api/repasses/${repasseId}/demonstrativo`, { method: "POST" });
    setEnviando(false);
    router.refresh();
  }

  async function confirmarPago() {
    setEnviando(true);
    await fetch(`/api/repasses/${repasseId}/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setEnviando(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 justify-end items-center">
      {demonstrativoUrl && (
        <a
          href={demonstrativoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline text-sm"
        >
          Demonstrativo
        </a>
      )}
      {!demonstrativoUrl && (
        <button
          onClick={gerarDemonstrativo}
          disabled={enviando}
          className="text-primary hover:underline text-sm disabled:opacity-60"
        >
          Gerar demonstrativo
        </button>
      )}
      {status !== "pago" ? (
        <button
          onClick={confirmarPago}
          disabled={enviando}
          className="bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          Marcar como pago
        </button>
      ) : (
        <span className="text-xs text-gray-400">Pago</span>
      )}
    </div>
  );
}
