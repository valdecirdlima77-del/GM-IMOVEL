"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CAMPO =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-graphite focus:outline-none focus:border-primary";

export default function NovoProcessoForm({ clientes }: { clientes: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.currentTarget).entries());
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/juridico/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível salvar o processo.");
        return;
      }
      router.push(`/admin/juridico/${corpo.processo.id}`);
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de ação *</label>
        <input name="tipo" required className={CAMPO} placeholder="Ex.: Ação de cobrança" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Número do processo</label>
          <input name="numero_processo" className={CAMPO} placeholder="0000000-00.0000.0.00.0000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data de distribuição</label>
          <input name="data_distribuicao" type="date" className={CAMPO} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vara</label>
          <input name="vara" className={CAMPO} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Comarca</label>
          <input name="comarca" className={CAMPO} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
        <select name="cliente_id" defaultValue="" className={CAMPO}>
          <option value="">Sem vínculo</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
        <textarea name="descricao" rows={3} className={CAMPO} />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar processo"}
        </button>
      </div>
    </form>
  );
}
