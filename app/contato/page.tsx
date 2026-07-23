"use client";

import { FormEvent, useState } from "react";

const WHATSAPP_NUMERO = "5567998500610";

type FormularioContato = {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
};

const FORMULARIO_INICIAL: FormularioContato = {
  nome: "",
  email: "",
  telefone: "",
  mensagem: "",
};

export default function ContatoPage() {
  const [form, setForm] = useState<FormularioContato>(FORMULARIO_INICIAL);
  const [enviado, setEnviado] = useState<boolean>(false);

  function atualizarCampo(campo: keyof FormularioContato, valor: string): void {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Sem backend de mensagens ainda — por enquanto apenas confirma o envio
    // na tela. Pode futuramente gravar em `mensagens` no Supabase.
    setEnviado(true);
    setForm(FORMULARIO_INICIAL);
  }

  const mensagemWhatsapp = encodeURIComponent(
    "Olá! Vim pelo site da GM Negócios Imobiliários e gostaria de mais informações."
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-heading text-2xl font-bold text-graphite mb-2">
        Fale com a gente
      </h1>
      <p className="text-gray-500 mb-8">
        Preencha o formulário abaixo ou fale direto com um corretor pelo
        WhatsApp.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={aoEnviar} className="space-y-4">
          {enviado && (
            <div className="bg-success/10 text-success text-sm rounded-lg px-4 py-3">
              Mensagem enviada! Em breve entraremos em contato.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              Nome
            </label>
            <input
              required
              type="text"
              value={form.nome}
              onChange={(e) => atualizarCampo("nome", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              E-mail
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => atualizarCampo("email", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => atualizarCampo("telefone", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              Mensagem
            </label>
            <textarea
              required
              rows={4}
              value={form.mensagem}
              onChange={(e) => atualizarCampo("mensagem", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Enviar mensagem
          </button>
        </form>

        <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
          <h2 className="font-heading font-bold text-graphite text-lg mb-2">
            Prefere o WhatsApp?
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Fale agora mesmo com nossa equipe.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${mensagemWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-secondary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Conversar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
