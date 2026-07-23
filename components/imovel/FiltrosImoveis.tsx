"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

const TIPOS: { value: string; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
];

const FINALIDADES: { value: string; label: string }[] = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
];

const QUARTOS_OPCOES: { value: string; label: string }[] = [
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

export default function FiltrosImoveis() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tipo, setTipo] = useState<string>(searchParams.get("tipo") ?? "");
  const [finalidade, setFinalidade] = useState<string>(
    searchParams.get("finalidade") ?? ""
  );
  const [precoMin, setPrecoMin] = useState<string>(
    searchParams.get("precoMin") ?? ""
  );
  const [precoMax, setPrecoMax] = useState<string>(
    searchParams.get("precoMax") ?? ""
  );
  const [quartos, setQuartos] = useState<string>(
    searchParams.get("quartos") ?? ""
  );
  const [bairro, setBairro] = useState<string>(searchParams.get("bairro") ?? "");

  function aplicarFiltros(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (finalidade) params.set("finalidade", finalidade);
    if (precoMin) params.set("precoMin", precoMin);
    if (precoMax) params.set("precoMax", precoMax);
    if (quartos) params.set("quartos", quartos);
    if (bairro) params.set("bairro", bairro);

    router.push(`/imoveis?${params.toString()}`);
  }

  function limparFiltros() {
    setTipo("");
    setFinalidade("");
    setPrecoMin("");
    setPrecoMax("");
    setQuartos("");
    setBairro("");
    router.push("/imoveis");
  }

  return (
    <form
      onSubmit={aplicarFiltros}
      className="bg-white border border-gray-200 rounded-xl p-5 space-y-5"
    >
      <h2 className="font-heading font-bold text-graphite text-lg">Filtros</h2>

      {/* Finalidade */}
      <div>
        <p className="text-sm font-medium text-graphite mb-2">Finalidade</p>
        <div className="flex gap-2">
          {FINALIDADES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() =>
                setFinalidade((atual) => (atual === f.value ? "" : f.value))
              }
              className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                finalidade === f.value
                  ? "bg-primary text-white border-primary"
                  : "border-gray-300 text-graphite hover:border-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="text-sm font-medium text-graphite mb-2 block" htmlFor="tipo">
          Tipo de imóvel
        </label>
        <select
          id="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Faixa de preço */}
      <div>
        <p className="text-sm font-medium text-graphite mb-2">Faixa de preço</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín."
            value={precoMin}
            onChange={(e) => setPrecoMin(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder="Máx."
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Quartos */}
      <div>
        <label className="text-sm font-medium text-graphite mb-2 block" htmlFor="quartos">
          Quartos
        </label>
        <select
          id="quartos"
          value={quartos}
          onChange={(e) => setQuartos(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Qualquer</option>
          {QUARTOS_OPCOES.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bairro */}
      <div>
        <label className="text-sm font-medium text-graphite mb-2 block" htmlFor="bairro">
          Bairro
        </label>
        <input
          id="bairro"
          type="text"
          placeholder="Buscar por bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="submit"
          className="bg-primary text-white text-sm font-medium py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={limparFiltros}
          className="text-sm text-gray-500 hover:text-graphite py-1"
        >
          Limpar filtros
        </button>
      </div>
    </form>
  );
}
