"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatarMoeda } from "@/lib/formatadores";

export type ProprietarioOpcao = { id: string; nome: string };

type Previa = {
  valor_bruto: number;
  taxa_administracao: number;
  total_despesas: number;
  valor_liquido: number;
  itens: { descricao: string; valor: number; sinal: string }[];
};

export default function GerarRepasse({ proprietarios }: { proprietarios: ProprietarioOpcao[] }) {
  const router = useRouter();
  const [proprietarioId, setProprietarioId] = useState("");
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState("");

  async function calcular() {
    if (!proprietarioId) {
      setErro("Selecione o proprietário.");
      return;
    }
    setCalculando(true);
    setErro("");
    setPrevia(null);
    try {
      const resposta = await fetch("/api/repasses/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proprietario_id: proprietarioId,
          competencia: `${competencia}-01`,
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setErro(resultado.erro ?? "Erro ao calcular repasse.");
        setCalculando(false);
        return;
      }
      setPrevia(resultado);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCalculando(false);
    }
  }

  async function gerar() {
    setGravando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/repasses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proprietario_id: proprietarioId,
          competencia: `${competencia}-01`,
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setErro(resultado.erro ?? "Erro ao gerar repasse.");
        setGravando(false);
        return;
      }
      setPrevia(null);
      setProprietarioId("");
      router.refresh();
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setGravando(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-heading font-bold text-graphite">Gerar repasse</h2>

      {erro && (
        <div className="bg-danger/10 text-danger text-sm rounded-lg px-4 py-3">{erro}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-graphite block mb-1">Proprietário</label>
          <select
            value={proprietarioId}
            onChange={(e) => {
              setProprietarioId(e.target.value);
              setPrevia(null);
            }}
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
          <label className="text-sm font-medium text-graphite block mb-1">Competência</label>
          <input
            type="month"
            value={competencia}
            onChange={(e) => {
              setCompetencia(e.target.value);
              setPrevia(null);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        onClick={calcular}
        disabled={calculando}
        className="bg-gray-100 text-graphite text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60"
      >
        {calculando ? "Calculando..." : "Calcular prévia"}
      </button>

      {previa && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="text-sm space-y-1">
            {previa.itens.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{item.descricao}</span>
                <span>
                  {item.sinal === "debito" ? "- " : "+ "}
                  {formatarMoeda(item.valor)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
            <span>Valor bruto</span>
            <span>{formatarMoeda(previa.valor_bruto)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Taxa de administração</span>
            <span>- {formatarMoeda(previa.taxa_administracao)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Despesas</span>
            <span>- {formatarMoeda(previa.total_despesas)}</span>
          </div>
          <div className="flex justify-between font-bold text-graphite pt-2 border-t border-gray-100">
            <span>Valor líquido</span>
            <span>{formatarMoeda(previa.valor_liquido)}</span>
          </div>

          <button
            onClick={gerar}
            disabled={gravando}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 mt-2"
          >
            {gravando ? "Gerando..." : "Confirmar e gerar repasse"}
          </button>
        </div>
      )}
    </div>
  );
}
