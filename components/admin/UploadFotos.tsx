"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { comprimirImagem } from "@/lib/imagens/comprimir";

type Foto = {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
};

type ItemEmEnvio = {
  chave: string;
  nomeArquivo: string;
  progresso: "comprimindo" | "enviando" | "erro";
  erro?: string;
};

type UploadFotosProps = {
  imovelId: string;
};

export default function UploadFotos({ imovelId }: UploadFotosProps) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [emEnvio, setEmEnvio] = useState<ItemEmEnvio[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function carregarFotos() {
      const supabase = criarClienteSupabase();
      const { data } = await supabase
        .from("fotos")
        .select("id, url, ordem, principal")
        .eq("imovel_id", imovelId)
        .order("ordem", { ascending: true });

      setFotos((data as Foto[]) ?? []);
      setCarregando(false);
    }

    carregarFotos();
  }, [imovelId]);

  async function enviarArquivos(arquivos: FileList | null): Promise<void> {
    if (!arquivos || arquivos.length === 0) return;

    const lista = Array.from(arquivos);

    for (const arquivo of lista) {
      const chave = `${arquivo.name}-${Date.now()}`;
      setEmEnvio((atuais) => [
        ...atuais,
        { chave, nomeArquivo: arquivo.name, progresso: "comprimindo" },
      ]);

      try {
        const { blob, nomeArquivo } = await comprimirImagem(arquivo);

        setEmEnvio((atuais) =>
          atuais.map((item) =>
            item.chave === chave ? { ...item, progresso: "enviando" } : item
          )
        );

        const formData = new FormData();
        formData.append("arquivo", blob, nomeArquivo);

        const resposta = await fetch(`/api/imoveis/${imovelId}/fotos`, {
          method: "POST",
          body: formData,
        });

        const resultado = (await resposta.json()) as {
          erro?: string;
          foto?: Foto;
        };

        if (!resposta.ok || !resultado.foto) {
          throw new Error(resultado.erro ?? "Falha ao enviar a foto.");
        }

        setFotos((atuais) => [...atuais, resultado.foto as Foto]);
        setEmEnvio((atuais) => atuais.filter((item) => item.chave !== chave));
      } catch (erro) {
        setEmEnvio((atuais) =>
          atuais.map((item) =>
            item.chave === chave
              ? {
                  ...item,
                  progresso: "erro",
                  erro: erro instanceof Error ? erro.message : "Erro ao enviar.",
                }
              : item
          )
        );
      }
    }
  }

  async function removerFoto(foto: Foto): Promise<void> {
    const confirmou = window.confirm(`Remover esta foto?`);
    if (!confirmou) return;

    setFotos((atuais) => atuais.filter((f) => f.id !== foto.id));

    const resposta = await fetch(
      `/api/imoveis/${imovelId}/fotos?fotoId=${foto.id}`,
      { method: "DELETE" }
    );

    if (!resposta.ok) {
      // Falhou no servidor — devolve a foto pra lista pra não sumir em silêncio.
      setFotos((atuais) => [...atuais, foto].sort((a, b) => a.ordem - b.ordem));
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-graphite">Fotos</h2>
        <p className="text-sm text-gray-500 mt-1">
          A primeira foto enviada aparece como capa do imóvel. Envie quantas
          quiser — o tamanho é reduzido automaticamente.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          enviarArquivos(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12m4.5-4.5v13.5"
          />
        </svg>
        <span className="text-sm font-medium">
          Toque para escolher fotos do celular ou computador
        </span>
      </button>

      {carregando ? (
        <p className="text-sm text-gray-400">Carregando fotos...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
            >
              <Image
                src={foto.url}
                alt="Foto do imóvel"
                fill
                className="object-cover"
              />
              {foto.principal && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => removerFoto(foto)}
                aria-label="Remover foto"
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
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
          ))}

          {emEnvio.map((item) => (
            <div
              key={item.chave}
              className="relative aspect-square rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-2 text-center"
            >
              {item.progresso === "erro" ? (
                <>
                  <span className="text-danger text-xs font-medium">
                    Falhou
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                    {item.erro}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-gray-400 mt-2">
                    {item.progresso === "comprimindo"
                      ? "Preparando..."
                      : "Enviando..."}
                  </span>
                </>
              )}
            </div>
          ))}

          {fotos.length === 0 && emEnvio.length === 0 && (
            <div className="col-span-2 sm:col-span-4 text-center py-6 text-sm text-gray-400">
              Nenhuma foto ainda.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
