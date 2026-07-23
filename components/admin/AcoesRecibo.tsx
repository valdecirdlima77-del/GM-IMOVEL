"use client";

import { useState } from "react";

type Props = {
  reciboId: string;
  pdfUrl: string | null;
};

export default function AcoesRecibo({ reciboId, pdfUrl }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function reenviar(meio: "whatsapp" | "email") {
    setEnviando(true);
    setMensagem("");
    try {
      const resposta = await fetch(`/api/recibos/${reciboId}/reenviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destino: "ambos", meio }),
      });
      if (!resposta.ok) {
        setMensagem("Erro ao reenviar.");
      } else {
        setMensagem("Reenviado!");
      }
    } catch {
      setMensagem("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium text-sm"
          >
            Ver PDF
          </a>
        )}
        <button
          onClick={() => reenviar("whatsapp")}
          disabled={enviando}
          className="text-gray-600 hover:text-primary text-sm"
        >
          WhatsApp
        </button>
        <button
          onClick={() => reenviar("email")}
          disabled={enviando}
          className="text-gray-600 hover:text-primary text-sm"
        >
          E-mail
        </button>
      </div>
      {mensagem && <span className="text-xs text-gray-400">{mensagem}</span>}
    </div>
  );
}
