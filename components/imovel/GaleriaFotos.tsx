"use client";

import Image from "next/image";
import { useState } from "react";

type Foto = {
  url: string;
  ordem: number;
};

type GaleriaFotosProps = {
  fotos: Foto[];
  titulo: string;
};

export default function GaleriaFotos({ fotos, titulo }: GaleriaFotosProps) {
  const [indiceAtivo, setIndiceAtivo] = useState<number>(0);

  if (!fotos || fotos.length === 0) {
    return (
      <div className="w-full h-72 md:h-96 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        Sem fotos disponíveis
      </div>
    );
  }

  const fotoPrincipal = fotos[indiceAtivo];

  return (
    <div>
      <div className="relative w-full h-72 md:h-96 bg-gray-100 rounded-xl overflow-hidden">
        <Image
          src={fotoPrincipal.url}
          alt={`${titulo} - foto ${indiceAtivo + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {fotos.map((foto, indice) => (
            <button
              key={foto.url + indice}
              type="button"
              onClick={() => setIndiceAtivo(indice)}
              className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                indice === indiceAtivo ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={foto.url}
                alt={`${titulo} - miniatura ${indice + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
