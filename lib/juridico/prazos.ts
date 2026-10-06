// Classificação de prazos processuais. Trabalha com datas 'YYYY-MM-DD' e com
// "hoje" passado por parâmetro, para ser determinístico nos testes.

export const DIAS_ALERTA_PRAZO = 5;

export type SituacaoPrazo = "concluido" | "vencido" | "urgente" | "proximo" | "no_prazo";

// Diferença em dias entre duas datas 'YYYY-MM-DD' (dataPrazo - hoje), usando
// UTC para não haver variação de horário de verão nem de fuso.
export function diasAte(dataPrazo: string, hoje: string): number {
  const [a, b] = [dataPrazo, hoje].map((d) => {
    const [ano, mes, dia] = d.split("-").map(Number);
    return Date.UTC(ano, mes - 1, dia);
  });
  return Math.round((a - b) / 86400000);
}

export function situacaoPrazo(
  prazo: { data_prazo: string; concluido: boolean },
  hoje: string
): SituacaoPrazo {
  if (prazo.concluido) return "concluido";
  const dias = diasAte(prazo.data_prazo, hoje);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_ALERTA_PRAZO) return "urgente";
  if (dias <= 15) return "proximo";
  return "no_prazo";
}

// Prazos que exigem atenção agora: vencidos ou dentro da janela de alerta,
// ainda não concluídos. É o que aparece no bloco URGENTE do dashboard.
export function prazosQueExigemAtencao<T extends { data_prazo: string; concluido: boolean }>(
  prazos: T[],
  hoje: string
): T[] {
  return prazos.filter((p) => {
    const s = situacaoPrazo(p, hoje);
    return s === "vencido" || s === "urgente";
  });
}
