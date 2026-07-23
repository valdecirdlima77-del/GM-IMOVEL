// Gerador de PDF minimalista, sem dependências externas.
//
// Escreve um PDF válido "na mão" (sintaxe PDF 1.4, texto em Helvetica),
// suficiente para recibos e contratos simples de uma página. Não suporta
// imagens, quebra automática de texto ou múltiplas páginas — para isso,
// no futuro, trocar por uma lib como pdf-lib.

export type LinhaPdf = {
  texto: string;
  tamanho?: number; // pt, padrão 11
  negrito?: boolean;
  espacoAntes?: number; // pt extras antes da linha, padrão 0
};

const LARGURA_A4 = 595.28;
const ALTURA_A4 = 841.89;
const MARGEM_ESQUERDA = 56;
const MARGEM_TOPO = 780;

function escaparTextoPdf(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (Helvetica base14 não tem WinAnsi completo aqui)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function gerarPdfSimples(titulo: string, linhas: LinhaPdf[]): Uint8Array {
  let cursorY = MARGEM_TOPO;
  const comandos: string[] = [];

  for (const linha of linhas) {
    const tamanho = linha.tamanho ?? 11;
    cursorY -= (linha.espacoAntes ?? 0) + tamanho + 4;
    const fonte = linha.negrito ? "/F2" : "/F1";
    comandos.push(
      `BT ${fonte} ${tamanho} Tf ${MARGEM_ESQUERDA} ${cursorY.toFixed(
        2
      )} Td (${escaparTextoPdf(linha.texto)}) Tj ET`
    );
  }

  const conteudoStream = comandos.join("\n");

  const objetos: string[] = [];
  objetos.push("<< /Type /Catalog /Pages 2 0 R >>"); // 1
  objetos.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"); // 2
  objetos.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGURA_A4} ${ALTURA_A4}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`
  ); // 3
  objetos.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"); // 4
  objetos.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"); // 5
  objetos.push(
    `<< /Length ${conteudoStream.length} >>\nstream\n${conteudoStream}\nendstream`
  ); // 6

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objetos.forEach((corpo, indice) => {
    offsets.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${corpo}\nendobj\n`;
  });

  const offsetXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objetos.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info << /Title (${escaparTextoPdf(
    titulo
  )}) >> >>\nstartxref\n${offsetXref}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export function pdfParaBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
