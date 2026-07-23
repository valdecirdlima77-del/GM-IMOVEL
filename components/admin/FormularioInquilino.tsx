"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type FormularioInquilinoValores = {
  nome: string;
  cpf: string;
  rg: string;
  email: string;
  telefone: string;
  whatsapp: string;
  comprovante_renda_url: string;
  renda_declarada: string;
  fiador_nome: string;
  fiador_telefone: string;
  observacoes: string;
  ativo: boolean;
};

export const INQUILINO_VAZIO: FormularioInquilinoValores = {
  nome: "",
  cpf: "",
  rg: "",
  email: "",
  telefone: "",
  whatsapp: "",
  comprovante_renda_url: "",
  renda_declarada: "",
  fiador_nome: "",
  fiador_telefone: "",
  observacoes: "",
  ativo: true,
};

type Props = {
  valoresIniciais: FormularioInquilinoValores;
  inquilinoId?: string;
};

export default function FormularioInquilino({ valoresIniciais, inquilinoId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(valoresIniciais);
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  function campo<K extends keyof FormularioInquilinoValores>(chave: K, valor: FormularioInquilinoValores[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensagemErro("");

    const rota = inquilinoId ? `/api/inquilinos/${inquilinoId}` : "/api/inquilinos";
    const metodo = inquilinoId ? "PUT" : "POST";

    try {
      const resposta = await fetch(rota, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          renda_declarada: form.renda_declarada ? Number(form.renda_declarada) : null,
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setMensagemErro(resultado.erro ?? "Erro ao salvar inquilino.");
        setEnviando(false);
        return;
      }
      router.push("/admin/alugueis/inquilinos");
      router.refresh();
    } catch {
      setMensagemErro("Erro de conexão. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-6 max-w-2xl">
      {mensagemErro && (
        <div className="bg-danger/10 text-danger text-sm rounded-lg px-4 py-3">{mensagemErro}</div>
      )}

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-graphite">Dados do inquilino</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome" required value={form.nome} onChange={(v) => campo("nome", v)} />
          <Campo label="CPF" value={form.cpf} onChange={(v) => campo("cpf", v)} />
          <Campo label="RG" value={form.rg} onChange={(v) => campo("rg", v)} />
          <Campo label="Telefone" required value={form.telefone} onChange={(v) => campo("telefone", v)} />
          <Campo label="WhatsApp" value={form.whatsapp} onChange={(v) => campo("whatsapp", v)} />
          <Campo label="E-mail" value={form.email} onChange={(v) => campo("email", v)} />
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Status</label>
            <select
              value={form.ativo ? "1" : "0"}
              onChange={(e) => campo("ativo", e.target.value === "1")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-graphite">Comprovação de renda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            label="Renda declarada (R$)"
            type="number"
            value={form.renda_declarada}
            onChange={(v) => campo("renda_declarada", v)}
          />
          <Campo
            label="URL do comprovante"
            value={form.comprovante_renda_url}
            onChange={(v) => campo("comprovante_renda_url", v)}
          />
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-graphite">Fiador (opcional)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome do fiador" value={form.fiador_nome} onChange={(v) => campo("fiador_nome", v)} />
          <Campo
            label="Telefone do fiador"
            value={form.fiador_telefone}
            onChange={(v) => campo("fiador_telefone", v)}
          />
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-graphite">Observações</h2>
        <textarea
          value={form.observacoes}
          onChange={(e) => campo("observacoes", e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </section>

      <button
        type="submit"
        disabled={enviando}
        className="bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Salvar inquilino"}
      </button>
    </form>
  );
}

function Campo({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-graphite block mb-1">{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
