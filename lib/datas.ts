// Datas do escritório. O servidor da Vercel roda em UTC, e Mato Grosso do Sul
// fica em UTC-4. Sem fuso explícito, depois das 20h o "hoje" e o mês corrente
// viram o dia seguinte, e a competência de cobranças e repasses sai errada.

// Brasília de MS: America/Cuiaba e America/Campo_Grande têm o mesmo fuso (UTC-4,
// sem horário de verão). America/Cuiaba é o fuso pedido para o escritório.
export const FUSO_ESCRITORIO = "America/Cuiaba";

// Data 'YYYY-MM-DD' no fuso do escritório para um instante qualquer.
export function dataNoFuso(instante: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_ESCRITORIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);
  const pega = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${pega("year")}-${pega("month")}-${pega("day")}`;
}

export function hojeNoEscritorio(): string {
  return dataNoFuso(new Date());
}

// Soma dias a uma data 'YYYY-MM-DD' em aritmética de calendário (UTC), sem Date local.
export function dataSomandoDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}
