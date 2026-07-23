"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const TIPOS = ["casa", "apartamento", "terreno", "comercial", "rural"];
const FINALIDADES = ["venda", "aluguel"];
const STATUSES = [
  "rascunho",
  "em_analise",
  "publicado",
  "pausado",
  "vendido",
  "alugado",
];

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type FormularioImovel = {
  titulo: string;
  slug: string;
  descricao: string;
  tipo: string;
  finalidade: string;
  status: string;
  preco: string;
  condominio: string;
  iptu: string;
  area_util: string;
  quartos: string;
  banheiros: string;
  vagas_garagem: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

const FORMULARIO_INICIAL: FormularioImovel = {
  titulo: "",
  slug: "",
  descricao: "",
  tipo: "casa",
  finalidade: "venda",
  status: "rascunho",
  preco: "",
  condominio: "",
  iptu: "",
  area_util: "",
  quartos: "0",
  banheiros: "0",
  vagas_garagem: "0",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "MS",
  cep: "",
};

export default function NovoImovelPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormularioImovel>(FORMULARIO_INICIAL);
  const [slugEditadoManualmente, setSlugEditadoManualmente] =
    useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string>("");
  const [mensagemSucesso, setMensagemSucesso] = useState<string>("");

  function atualizarCampo(
    campo: keyof FormularioImovel,
    valor: string
  ): void {
    setForm((atual) => {
      const novo = { ...atual, [campo]: valor };
      if (campo === "titulo" && !slugEditadoManualmente) {
        novo.slug = gerarSlug(valor);
      }
      return novo;
    });
  }

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const resposta = await fetch("/api/imoveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          slug: form.slug,
          descricao: form.descricao,
          tipo: form.tipo,
          finalidade: form.finalidade,
          status: form.status,
          preco: Number(form.preco || 0),
          condominio: form.condominio ? Number(form.condominio) : null,
          iptu: form.iptu ? Number(form.iptu) : null,
          area_util: form.area_util ? Number(form.area_util) : null,
          quartos: Number(form.quartos || 0),
          banheiros: Number(form.banheiros || 0),
          vagas_garagem: Number(form.vagas_garagem || 0),
          logradouro: form.logradouro,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          cep: form.cep,
        }),
      });

      const resultado = (await resposta.json()) as {
        erro?: string;
        imovel?: { id: string };
      };

      if (!resposta.ok || resultado.erro) {
        setMensagemErro(resultado.erro ?? "Erro ao cadastrar imóvel.");
        setEnviando(false);
        return;
      }

      setMensagemSucesso("Imóvel cadastrado com sucesso!");
      setTimeout(() => {
        router.push("/admin/imoveis");
      }, 1200);
    } catch (erro) {
      setMensagemErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Novo imóvel
      </h1>

      {mensagemErro && (
        <div className="bg-danger/10 text-danger text-sm rounded-lg px-4 py-3 mb-4">
          {mensagemErro}
        </div>
      )}
      {mensagemSucesso && (
        <div className="bg-success/10 text-success text-sm rounded-lg px-4 py-3 mb-4">
          {mensagemSucesso}
        </div>
      )}

      <form onSubmit={aoEnviar} className="space-y-6">
        {/* Dados principais */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-bold text-graphite">
            Dados do imóvel
          </h2>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              Título
            </label>
            <input
              required
              type="text"
              value={form.titulo}
              onChange={(e) => atualizarCampo("titulo", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              Slug (URL)
            </label>
            <input
              required
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugEditadoManualmente(true);
                atualizarCampo("slug", gerarSlug(e.target.value));
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-graphite block mb-1">
              Descrição
            </label>
            <textarea
              value={form.descricao}
              onChange={(e) => atualizarCampo("descricao", e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) => atualizarCampo("tipo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Finalidade
              </label>
              <select
                value={form.finalidade}
                onChange={(e) => atualizarCampo("finalidade", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {FINALIDADES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => atualizarCampo("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Valores */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-bold text-graphite">Valores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Preço (R$)
              </label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.preco}
                onChange={(e) => atualizarCampo("preco", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Condomínio (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.condominio}
                onChange={(e) => atualizarCampo("condominio", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                IPTU (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.iptu}
                onChange={(e) => atualizarCampo("iptu", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-bold text-graphite">
            Características
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Área útil (m²)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.area_util}
                onChange={(e) => atualizarCampo("area_util", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Quartos
              </label>
              <input
                type="number"
                min={0}
                value={form.quartos}
                onChange={(e) => atualizarCampo("quartos", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Banheiros
              </label>
              <input
                type="number"
                min={0}
                value={form.banheiros}
                onChange={(e) => atualizarCampo("banheiros", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Vagas garagem
              </label>
              <input
                type="number"
                min={0}
                value={form.vagas_garagem}
                onChange={(e) =>
                  atualizarCampo("vagas_garagem", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-bold text-graphite">Endereço</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-graphite block mb-1">
                Logradouro
              </label>
              <input
                required
                type="text"
                value={form.logradouro}
                onChange={(e) => atualizarCampo("logradouro", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Número
              </label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => atualizarCampo("numero", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => atualizarCampo("complemento", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Bairro
              </label>
              <input
                required
                type="text"
                value={form.bairro}
                onChange={(e) => atualizarCampo("bairro", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                CEP
              </label>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => atualizarCampo("cep", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Cidade
              </label>
              <input
                required
                type="text"
                value={form.cidade}
                onChange={(e) => atualizarCampo("cidade", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-graphite block mb-1">
                Estado
              </label>
              <select
                value={form.estado}
                onChange={(e) => atualizarCampo("estado", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={enviando}
          className="bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {enviando ? "Salvando..." : "Cadastrar imóvel"}
        </button>
      </form>
    </div>
  );
}
