"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

// Widget de atendimento.
// Conversa com a rota local `/api/ia/chat`, que ainda devolve uma resposta
// fixa — não há IA, banco nem provedor externo por trás dela.
// `RESPOSTA_PROVISORIA` abaixo é usada apenas quando a rota não responde.

type Mensagem = {
  id: number;
  autor: "cliente" | "agente";
  texto: string;
};

const MENSAGEM_INICIAL: Mensagem = {
  id: 0,
  autor: "agente",
  texto:
    "Olá! Sou o assistente da GM Negócios Imobiliários. Em breve poderei tirar suas dúvidas sobre imóveis, aluguéis e agendamento de visitas.",
};

const RESPOSTA_PROVISORIA =
  "Ainda estou em preparação e não consigo responder por aqui. Para atendimento imediato, fale com a Geisa pelo WhatsApp (67) 99850-0610.";

const WHATSAPP_URL =
  "https://wa.me/5567998500610?text=Ol%C3%A1%2C%20Geisa!%20Vim%20pelo%20site%20da%20GM%20Neg%C3%B3cios%20Imobili%C3%A1rios%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.";

// Id anônimo por visitante, só para a Agente Geisa manter o contexto da
// conversa entre mensagens (não é dado pessoal — gerado no navegador,
// nunca enviado a lugar nenhum além de /api/ia/chat).
function obterVisitanteId(): string {
  const CHAVE = "gm_visitante_id";
  try {
    const existente = window.localStorage.getItem(CHAVE);
    if (existente) return existente;
    const novo =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(CHAVE, novo);
    return novo;
  } catch {
    // Storage indisponível (modo privado, etc.) — ainda funciona, só sem
    // lembrar o contexto entre recarregamentos da página.
    return `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState<boolean>(false);
  const [rascunho, setRascunho] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_INICIAL]);

  const fimDaListaRef = useRef<HTMLDivElement | null>(null);
  const campoRef = useRef<HTMLInputElement | null>(null);

  // Rola para a última mensagem sempre que a conversa cresce.
  useEffect(() => {
    if (aberto) {
      fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, aberto]);

  // Foca o campo ao abrir o painel.
  useEffect(() => {
    if (aberto) {
      campoRef.current?.focus();
    }
  }, [aberto]);

  // Esc fecha o painel.
  useEffect(() => {
    if (!aberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [aberto]);

  // Mesma regra do Header: o widget é de atendimento ao visitante e não deve
  // aparecer dentro do painel administrativo nem na tela de login.
  if (pathname?.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  function adicionarMensagem(autor: Mensagem["autor"], texto: string): void {
    setMensagens((atuais) => [...atuais, { id: atuais.length, autor, texto }]);
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();

    const texto = rascunho.trim();
    if (!texto || enviando) return;

    adicionarMensagem("cliente", texto);
    setRascunho("");
    setEnviando(true);

    try {
      const resposta = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: texto, visitante_id: obterVisitanteId() }),
      });

      if (!resposta.ok) {
        adicionarMensagem("agente", RESPOSTA_PROVISORIA);
        return;
      }

      const dados = (await resposta.json()) as { resposta?: string };
      adicionarMensagem("agente", dados.resposta ?? RESPOSTA_PROVISORIA);
    } catch {
      // Rede indisponível — mantém o visitante com um caminho de contato.
      adicionarMensagem("agente", RESPOSTA_PROVISORIA);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      {/* PAINEL DE CONVERSA */}
      {aberto && (
        <div
          role="dialog"
          aria-label="Assistente GM Negócios Imobiliários"
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          style={{ height: "min(30rem, calc(100vh - 8rem))" }}
        >
          {/* Cabeçalho */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ background: "linear-gradient(135deg, #6B4700 0%, #B8860B 100%)" }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <span className="font-heading text-sm font-bold">GM</span>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-heading text-sm font-bold">Assistente GM</p>
              <p className="truncate text-xs text-yellow-100/90">
                Negócios Imobiliários
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar conversa"
              className="rounded-lg p-1.5 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
            {mensagens.map((mensagem) => (
              <div
                key={mensagem.id}
                className={
                  mensagem.autor === "cliente" ? "flex justify-end" : "flex justify-start"
                }
              >
                <p
                  className={
                    mensagem.autor === "cliente"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-graphite shadow-sm"
                  }
                >
                  {mensagem.texto}
                </p>
              </div>
            ))}
            <div ref={fimDaListaRef} />
          </div>

          {/* Atalho de WhatsApp — canal que já funciona hoje */}
          <div className="border-t border-gray-100 bg-white px-4 pt-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.826L.057 23.882l6.204-1.626A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.662-.523-5.18-1.432l-.371-.22-3.844 1.007 1.027-3.748-.242-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Falar direto no WhatsApp
            </a>
          </div>

          {/* Campo de envio */}
          <form
            onSubmit={(evento) => {
              void aoEnviar(evento);
            }}
            className="flex items-center gap-2 bg-white px-4 py-3"
          >
            <label htmlFor="chat-gm-mensagem" className="sr-only">
              Sua mensagem
            </label>
            <input
              id="chat-gm-mensagem"
              ref={campoRef}
              type="text"
              value={rascunho}
              onChange={(evento) => setRascunho(evento.target.value)}
              placeholder={enviando ? "Enviando..." : "Escreva sua mensagem..."}
              autoComplete="off"
              disabled={enviando}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={!rascunho.trim() || enviando}
              aria-label="Enviar mensagem"
              className="shrink-0 rounded-lg bg-primary p-2.5 text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* BOTÃO FLUTUANTE */}
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente virtual"}
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 motion-reduce:transition-none motion-reduce:hover:scale-100"
        style={{ background: "linear-gradient(135deg, #B8860B 0%, #D4A829 100%)" }}
      >
        {aberto ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </>
  );
}
