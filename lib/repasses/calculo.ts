// Cálculo do repasse mensal ao proprietário. Função pura: recebe os valores já
// buscados no banco e devolve os totais e os itens do demonstrativo.

export type ValorRecebido = { descricao: string; valor: number };

export type EntradaRepasse = {
  alugueisPagos: ValorRecebido[];
  // Despesas do imóvel marcadas como repassáveis e pagas pelo proprietário.
  despesasRepassaveis: ValorRecebido[];
  comissaoPercentual: number;
};

export type ItemRepasse = {
  tipo: "aluguel" | "despesa" | "taxa_administracao";
  sinal: "credito" | "debito";
  descricao: string;
  valor: number;
};

export type ResultadoRepasse = {
  valor_bruto: number;
  taxa_administracao: number;
  total_despesas: number;
  valor_liquido: number;
  itens: ItemRepasse[];
};

export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularRepasse(entrada: EntradaRepasse): ResultadoRepasse {
  const bruto = arredondar(entrada.alugueisPagos.reduce((s, i) => s + i.valor, 0));
  const taxa = arredondar((bruto * entrada.comissaoPercentual) / 100);
  const despesas = arredondar(entrada.despesasRepassaveis.reduce((s, i) => s + i.valor, 0));
  const liquido = arredondar(bruto - taxa - despesas);

  const itens: ItemRepasse[] = [
    ...entrada.alugueisPagos.map((i) => ({
      tipo: "aluguel" as const,
      sinal: "credito" as const,
      descricao: i.descricao,
      valor: arredondar(i.valor),
    })),
    ...(taxa > 0
      ? [{
          tipo: "taxa_administracao" as const,
          sinal: "debito" as const,
          descricao: `Taxa de administração (${entrada.comissaoPercentual}%)`,
          valor: taxa,
        }]
      : []),
    ...entrada.despesasRepassaveis.map((i) => ({
      tipo: "despesa" as const,
      sinal: "debito" as const,
      descricao: i.descricao,
      valor: arredondar(i.valor),
    })),
  ];

  return {
    valor_bruto: bruto,
    taxa_administracao: taxa,
    total_despesas: despesas,
    valor_liquido: liquido,
    itens,
  };
}
