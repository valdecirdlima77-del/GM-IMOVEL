"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CAMPO =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-graphite focus:outline-none focus:border-primary";

// Aceita "1.000,50" (padrão brasileiro) e "1000.50". Se há vírgula, o ponto é
// separador de milhar; se não há, o ponto é decimal.
function valorBrasileiro(texto: string): number {
  const limpo = texto.trim();
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  return Number(normalizado);
}

export default function NovaReceitaModal({ dataPadrao }: { dataPadrao: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.currentTarget).entries());
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/financeiro/receitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dados, valor: valorBrasileiro(String(dados.valor)) }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível salvar a receita.");
        return;
      }
      setAberto(false);
      router.refresh();
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
      >
        + Nova receita
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={salvar} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-graphite">Nova receita</h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
              <input name="descricao" required className={CAMPO} placeholder="Ex.: Honorários ação de cobrança" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
                <input name="valor" required inputMode="decimal" className={CAMPO} placeholder="0,00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
                <input name="data_receita" type="date" required defaultValue={dataPadrao} className={CAMPO} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <input name="categoria" className={CAMPO} placeholder="Ex.: Comissão, Honorários" />
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={enviando}
                className="border border-gray-300 text-graphite text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {enviando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
