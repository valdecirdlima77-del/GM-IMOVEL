"use client";

import { useState } from "react";

export default function ConfigurarPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const [mensagem, setMensagem] = useState("");

  async function inicializar() {
    setStatus("loading");
    const res = await fetch("/api/admin/setup", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMensagem(data.mensagem ?? "Banco configurado!");
    } else {
      setStatus("erro");
      setMensagem(data.erro ?? "Erro ao configurar banco.");
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="font-heading text-2xl font-bold text-gray-800 mb-2">
        Configuração do sistema
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Clique no botão abaixo para criar todas as tabelas do banco de dados
        automaticamente. Faça isso apenas uma vez.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        {status === "idle" && (
          <button
            onClick={inicializar}
            className="w-full text-white font-semibold py-4 rounded-xl text-lg transition-opacity"
            style={{ background: "#B8860B" }}
          >
            🚀 Inicializar banco de dados
          </button>
        )}

        {status === "loading" && (
          <div className="text-center py-4">
            <div className="animate-spin text-4xl mb-3">⚙️</div>
            <p className="text-gray-600">Configurando banco de dados...</p>
          </div>
        )}

        {status === "ok" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-green-700 text-lg">{mensagem}</p>
            <a
              href="/admin/alugueis"
              className="mt-6 inline-block text-white px-6 py-3 rounded-xl font-semibold"
              style={{ background: "#B8860B" }}
            >
              Ir para o sistema de aluguéis →
            </a>
          </div>
        )}

        {status === "erro" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">❌</div>
            <p className="font-bold text-red-700 mb-2">Erro:</p>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{mensagem}</p>
            <p className="text-xs text-gray-400 mt-4">
              Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada no Vercel.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-gray-500 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
