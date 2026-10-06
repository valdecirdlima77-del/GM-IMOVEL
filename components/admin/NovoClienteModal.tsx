"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { valor: "inquilino", rotulo: "Locatário" },
  { valor: "proprietario", rotulo: "Proprietário" },
  { valor: "cliente_advocacia", rotulo: "Advocacia" },
  { valor: "lead", rotulo: "Lead" },
];

const CAMPO =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-graphite focus:outline-none focus:border-primary";

export default function NovoClienteModal() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.currentTarget).entries());
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível salvar o cliente.");
        return;
      }
      setAberto(false);
      setAviso("Cliente salvo.");
      setTimeout(() => setAviso(null), 2800);
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
        + Novo cliente
      </button>

      {aviso && (
        <div className="fixed bottom-6 right-6 bg-success text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg">
          {aviso}
        </div>
      )}

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={salvar} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-graphite">Novo cliente</h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input name="nome" required className={CAMPO} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
              <select name="tipo" required defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Escolha
                </option>
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CPF / CNPJ</label>
                <input name="cpf_cnpj" className={CAMPO} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input name="telefone" type="tel" className={CAMPO} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input name="email" type="email" className={CAMPO} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea name="notas" rows={2} className={CAMPO} />
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
