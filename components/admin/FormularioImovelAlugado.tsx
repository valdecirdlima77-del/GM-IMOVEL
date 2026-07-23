"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Opcao = { id: string; nome: string };

export type FormularioImovelAlugadoValores = {
  proprietario_id: string;
  inquilino_id: string;
  endereco_completo: string;
  valor_aluguel: string;
  dia_vencimento: string;
  status: string;
  data_inicio: string;
  data_fim: string;
};

export const IMOVEL_ALUGADO_VAZIO: FormularioImovelAlugadoValores = {
  proprietario_id: "",
  inquilino_id: "",
  endereco_completo: "",
  valor_aluguel: "",
  dia_vencimento: "5",
  status: "ativo",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_fim: "",
};

const STATUSES = [
  { valor: "ativo", rotulo: "Ativo" },
  { valor: "em_renovacao", rotulo: "Em renovação" },
  { valor: "inadimplente", rotulo: "Inadimplente" },
  { valor: "encerrado", rotulo: "Encerrado" },
];

type Props = {
  valoresIniciais: FormularioImovelAlugadoValores;
  locacaoId?: string;
  proprietarios: Opcao[];
  inquilinos: Opcao[];
};

export default function FormularioImovelAlugado({
  valoresIniciais,
  locacaoId,
  proprietarios,
  inquilinos,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState(valoresIniciais);
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  function campo<K extends keyof FormularioImovelAlugadoValores>(chave: K, valor: FormularioImovelAlugadoValores[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensagemErro("");

    const rota = locacaoId
      ? `/api/imoveis-alugados/${locacaoId}`
      : "/api/imoveis-alugados";
    const metodo = locacaoId ? "PUT" : "POST";

    try {
      const resposta = await fetch(rota, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imovel_id: null,
          proprietario_id: form.proprietario_id,
          inquilino_id: form.inquilino_id || null,
          endereco_completo: form.endereco_completo,
          valor_aluguel: Number(form.valor_aluguel || 0),
          dia_vencimento: Number(form.dia_vencimento || 5),
          status: form.status,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim || null,
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setMensagemErro(resultado.erro ?? "Erro ao salvar locação.");
        setEnviando(false);
        return;
      }
      router.push("/admin/alugueis/imoveis-alugados");
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
        <h2 className="font-heading font-bold text-graphite">Dados da locação</h2>

        <div>
          <label className="text-sm font-medium text-graphite block mb-1">Endereço completo</label>
          <input
            required
            type="text"
            value={form.endereco_completo}
            onChange={(e) => campo("endereco_completo", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Proprietário</label>
            <select
              required
              value={form.proprietario_id}
              onChange={(e) => campo("proprietario_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {proprietarios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Inquilino</label>
            <select
              value={form.inquilino_id}
              onChange={(e) => campo("inquilino_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Vago / sem inquilino</option>
              {inquilinos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Valor do aluguel (R$)</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.valor_aluguel}
              onChange={(e) => campo("valor_aluguel", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Dia de vencimento</label>
            <input
              required
              type="number"
              min={1}
              max={28}
              value={form.dia_vencimento}
              onChange={(e) => campo("dia_vencimento", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => campo("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Início do contrato</label>
            <input
              required
              type="date"
              value={form.data_inicio}
              onChange={(e) => campo("data_inicio", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-graphite block mb-1">Fim do contrato (opcional)</label>
            <input
              type="date"
              value={form.data_fim}
              onChange={(e) => campo("data_fim", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {!locacaoId && (
        <p className="text-xs text-gray-500">
          Ao salvar, a primeira cobrança mensal é gerada automaticamente com base no dia de vencimento informado.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Salvar locação"}
      </button>
    </form>
  );
}
