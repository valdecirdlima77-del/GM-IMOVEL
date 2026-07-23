export function formatarMoeda(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return "-";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

export function formatarDataHora(data: string | null | undefined): string {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

export function competenciaLabel(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${nomesMeses[Number(mes) - 1] ?? mes}/${ano}`;
}
