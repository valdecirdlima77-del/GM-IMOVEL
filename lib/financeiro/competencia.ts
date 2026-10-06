// Competência = mês de referência, guardada como DATE 'YYYY-MM-01'.
// Tudo aqui trabalha com texto e aritmética de mês, sem Date local, para não
// haver deslocamento de fuso (o mesmo bug que deslocava dias no dashboard).

export function competenciaDe(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

// Aceita 'YYYY-MM' ou 'YYYY-MM-DD' e devolve a competência normalizada, ou null.
export function parseCompetencia(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(valor.trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return competenciaDe(ano, mes);
}

export function deslocarCompetencia(competencia: string, meses: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const indice = ano * 12 + (mes - 1) + meses;
  return competenciaDe(Math.floor(indice / 12), (indice % 12) + 1);
}

// Primeiro e último dia do mês, em texto, para filtros `gte` / `lte` no banco.
export function intervaloCompetencia(competencia: string): { inicio: string; fim: string } {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return {
    inicio: competenciaDe(ano, mes),
    fim: `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const nome = NOMES_MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}
