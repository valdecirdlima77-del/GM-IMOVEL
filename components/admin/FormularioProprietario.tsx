"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type FormularioProprietarioValores = {
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  chave_pix: string;
  comissao_percentual: string;
  observacoes: string;
  ativo: boolean;
};

export const PROPRIETARIO_VAZIO: FormularioProprietarioValores = {
  nome: "",
  cpf_cnpj: "",
  email: "",
  telefone: "",
  banco: "",
  agencia: "",
  conta: "",
  tipo_conta: "pix",
  chave_pix: "",
  comissao_percentual: "10",
  observacoes: "",
  ativo: true,
};

type Props = {
  valoresIniciais: FormularioProprietarioValores;
  proprietarioId?: string;
};

export default function FormularioProprietario({ valoresIniciais, proprietarioId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(valoresIniciais);
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  function campo<K extends keyof FormularioProprietarioValores>(chave: K, valor: FormularioProprietarioValores[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensagemErro("");

    const rota = proprietarioId
      ? `/api/proprietarios/${proprietarioId}`
      : "/api/proprietarios";
    const metodo = proprietarioId ? "PUT" : "POST";

    try {
      const resposta = await fetch(rota, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          comissao_percentual: Number(form.comissao_percentual || 0),
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setMensagemErro(resultado.erro ?? "Erro ao salvar proprietário.");
        setEnviando(false);
        return;
      }
      router.push("/admin/alugueis/proprietarios");
      router.refresh();
    } catch {
      setMensagemErro("Erro de conexão. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-6 max-w-2xl">
      {mensagemErro && (
        <div className="bg-danger/10 text-danger text-sm rounded-lg px-4 py-3">
          {mensagemErro}
        </div>
      )}

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-graphite">Dados do proprietário</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome" required value={form.nome} onChange={(v) => campo("nome", v)} />
          <Campo label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(v) => campo("cpf_cnpj", v)} />
          <Campo label="Telefone" required value={form.telefone} onChange={(v) => campo("telefone", v)} />
          <Campo label="E-mail" value={form.email} onChange={(v) => campo("email", v)} />
          <Campo
            label="Comissão (%)"
            type="number"
            value={form.comissao_percentual}
            onChange={(v) => campo("comissao_percentual", v)}
          />
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
        <h2 className="font-heading font-bold text-graphite">Dados bancários</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Banco" value={form.banco} onChange={(v) => campo("banco", v)} />
          <Campo label="Agência" value={form.agencia} onChange={(v) => campo("agencia", v)} />
          <Campo label="Conta" value={form.conta} onChange={(v) => campo("conta", v)} />
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Tipo de conta</label>
            <select
              value={form.tipo_conta}
              onChange={(e) => campo("tipo_conta", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="pix">Pix</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </div>
          <Campo label="Chave Pix" value={form.chave_pix} onChange={(v) => campo("chave_pix", v)} />
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
        {enviando ? "Salvando..." : "Salvar proprietário"}
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
