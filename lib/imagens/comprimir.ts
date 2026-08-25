// Compressão de foto no navegador, antes do upload.
//
// Sem biblioteca nova: usa só Canvas API, nativa de todo navegador moderno.
// Reduz uma foto de celular (3-8 MB) para ~150-350 KB em WebP, o que evita
// estourar o plano gratuito do Supabase Storage conforme o número de imóveis
// cresce (ver análise de capacidade — 100 imóveis sem compressão passa de
// 3 GB só de fotos; com compressão fica na casa de 200-300 MB).

const LADO_MAXIMO_PX = 1600;
const QUALIDADE_WEBP = 0.82;

export type ResultadoCompressao = {
  blob: Blob;
  nomeArquivo: string;
};

function carregarComoImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Não foi possível abrir "${arquivo.name}" como imagem.`));
    };
    imagem.src = url;
  });
}

// Redimensiona mantendo proporção: o lado maior nunca passa de LADO_MAXIMO_PX.
// Fotos já pequenas (ex: capturas de tela) não são ampliadas.
function calcularDimensoes(larguraOriginal: number, alturaOriginal: number) {
  const maiorLado = Math.max(larguraOriginal, alturaOriginal);
  if (maiorLado <= LADO_MAXIMO_PX) {
    return { largura: larguraOriginal, altura: alturaOriginal };
  }
  const fator = LADO_MAXIMO_PX / maiorLado;
  return {
    largura: Math.round(larguraOriginal * fator),
    altura: Math.round(alturaOriginal * fator),
  };
}

export async function comprimirImagem(
  arquivo: File
): Promise<ResultadoCompressao> {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error(`"${arquivo.name}" não é uma imagem.`);
  }

  const imagem = await carregarComoImagem(arquivo);
  const { largura, altura } = calcularDimensoes(
    imagem.naturalWidth,
    imagem.naturalHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  if (!contexto) {
    throw new Error("Não foi possível preparar a imagem para compressão.");
  }
  contexto.drawImage(imagem, 0, 0, largura, altura);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((resultado) => resolve(resultado), "image/webp", QUALIDADE_WEBP);
  });

  if (!blob) {
    throw new Error(`Falha ao comprimir "${arquivo.name}".`);
  }

  const nomeBase = arquivo.name.replace(/\.[^.]+$/, "");
  return { blob, nomeArquivo: `${nomeBase}.webp` };
}
