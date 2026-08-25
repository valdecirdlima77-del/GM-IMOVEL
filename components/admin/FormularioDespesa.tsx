"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type ImovelAlugadoOpcao = { id: string; endereco_completo: string };

export type FormularioDespesaValores = {
  imovel_alugado_id: string;
  tipo: string;
  descricao: string;
  valor: string;
  competencia: string; // YYYY-MM
  pago_por: string;
  repassavel: boolean;
  observacoes: string;
};

export const DESPESA_VAZIA: FormularioDespesaValores = {
  imovel_alugado_id: "",
  tipo: "manutencao",
  descricao: "",
  valor: "",
  competencia: new Date().toISOString().slice(0, 7),
  pago_por: "proprietario",
  repassavel: true,
  observacoes: "",
};

type Props = {
  valoresIniciais: FormularioDespesaValores;
  imoveis: ImovelAlugadoOpcao[];
  despesaId?: string;
};

export default function FormularioDespesa({ valoresIniciais, imoveis, despesaId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(valoresIniciais);
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  function campo<K extends keyof FormularioDespesaValores>(chave: K, valor: FormularioDespesaValores[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensagemErro("");

    const rota = despesaId ? `/api/despesas/${despesaId}` : "/api/despesas";
    const metodo = despesaId ? "PUT" : "POST";

    try {
      const resposta = await fetch(rota, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valor: Number(form.valor || 0),
          competencia: `${form.competencia}-01`,
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setMensagemErro(resultado.erro ?? "Erro ao salvar despesa.");
        setEnviando(false);
        return;
      }
      router.push("/admin/alugueis/despesas");
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
        <h2 className="font-heading font-bold text-graphite">Dados da despesa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-graphite block mb-1">Imóvel</label>
            <select
              required
              value={form.imovel_alugado_id}
              onChange={(e) => campo("imovel_alugado_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {imoveis.map((imovel) => (
                <option key={imovel.id} value={imovel.id}>
                  {imovel.endereco_completo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => campo("tipo", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="manutencao">Manutenção</option>
              <option value="reparo">Reparo</option>
              <option value="taxa">Taxa</option>
              <option value="iptu">IPTU</option>
              <option value="condominio">Condomínio</option>
              <option value="outra">Outra</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Competência</label>
            <input
              required
              type="month"
              value={form.competencia}
              onChange={(e) => campo("competencia", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-graphite block mb-1">Descrição</label>
            <input
              required
              type="text"
              value={form.descricao}
              onChange={(e) => campo("descricao", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Valor (R$)</label>
            <input
              required
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => campo("valor", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Pago por</label>
            <select
              value={form.pago_por}
              onChange={(e) => campo("pago_por", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="proprietario">Proprietário</option>
              <option value="inquilino">Inquilino</option>
              <option value="imobiliaria">Imobiliária</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="repassavel"
              type="checkbox"
              checked={form.repassavel}
              onChange={(e) => campo("repassavel", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="repassavel" className="text-sm text-graphite">
              Descontar no repasse do proprietário
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-graphite">Observações</h2>
        <textarea
          value={form.observacoes}
          onChange={(e) => campo("observacoes", e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </section>

      <button
        type="submit"
        disabled={enviando}
        className="bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Salvar despesa"}
      </button>
    </form>
  );
}
