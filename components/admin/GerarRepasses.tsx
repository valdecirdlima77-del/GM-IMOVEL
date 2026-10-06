"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GerarRepasses({ competencia }: { competencia: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setEnviando(true);
    setErro(null);
    setAviso(null);
    try {
      const resposta = await fetch("/api/repasses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencia }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível gerar os repasses.");
        return;
      }
      const partes = [
        `${corpo.criados} criado${corpo.criados === 1 ? "" : "s"}`,
        `${corpo.recalculados} recalculado${corpo.recalculados === 1 ? "" : "s"}`,
      ];
      if (corpo.ignorados_ja_fechados) {
        partes.push(`${corpo.ignorados_ja_fechados} já confirmado${corpo.ignorados_ja_fechados === 1 ? "" : "s"} (mantido${corpo.ignorados_ja_fechados === 1 ? "" : "s"})`);
      }
      setAviso(partes.join(" · "));
      router.refresh();
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={gerar}
        disabled={enviando}
        className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {enviando ? "Gerando…" : "Gerar repasses"}
      </button>
      {aviso && <span className="text-xs text-gray-600 mt-1">{aviso}</span>}
      {erro && <span className="text-xs text-red-600 mt-1">{erro}</span>}
    </div>
  );
}
