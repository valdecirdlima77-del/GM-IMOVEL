"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  cobrancaId: string;
  status: string;
};

export default function AcoesCobranca({ cobrancaId, status }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function registrarPagamento() {
    if (!valor) {
      setErro("Informe o valor pago.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cobranca_id: cobrancaId,
          valor_pago: Number(valor),
          data_pagamento: new Date().toISOString().slice(0, 10),
          forma_pagamento: "pix",
          referencia_externa: null,
          observacoes: "",
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setErro(resultado.erro ?? "Erro ao registrar pagamento.");
        setEnviando(false);
        return;
      }
      setAberto(false);
      router.refresh();
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  async function cancelar() {
    setEnviando(true);
    await fetch(`/api/cobrancas/${cobrancaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelado" }),
    });
    setEnviando(false);
    router.refresh();
  }

  if (status === "pago") {
    return <span className="text-xs text-gray-400">Pago</span>;
  }

  if (!aberto) {
    return (
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setAberto(true)}
          className="text-primary hover:underline font-medium text-sm"
        >
          Registrar pagamento
        </button>
        {status !== "cancelado" && (
          <button
            onClick={cancelar}
            disabled={enviando}
            className="text-gray-400 hover:text-danger text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {erro && <span className="text-xs text-danger">{erro}</span>}
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Valor pago"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-sm"
        />
        <button
          onClick={registrarPagamento}
          disabled={enviando}
          className="bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {enviando ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setAberto(false)}
          className="text-gray-400 text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
