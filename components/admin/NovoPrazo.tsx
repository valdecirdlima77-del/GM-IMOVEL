"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CAMPO =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-graphite focus:outline-none focus:border-primary";

export default function NovoPrazo({ processoId }: { processoId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const dados = Object.fromEntries(new FormData(formulario).entries());
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/juridico/prazos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dados, processo_id: processoId }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível salvar o prazo.");
        return;
      }
      formulario.reset();
      router.refresh();
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição do prazo *</label>
        <input name="descricao" required className={CAMPO} placeholder="Ex.: Contestação" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Data fatal *</label>
        <input name="data_prazo" type="date" required className={CAMPO} />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "+ Adicionar prazo"}
      </button>
      {erro && <p className="md:col-span-3 text-sm text-red-600">{erro}</p>}
    </form>
  );
}
