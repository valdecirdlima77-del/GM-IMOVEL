import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { termoSeguro, linkWhatsApp } from "../../lib/clientes/contato.ts";
import {
  competenciaDe,
  parseCompetencia,
  deslocarCompetencia,
  intervaloCompetencia,
  rotuloCompetencia,
} from "../../lib/financeiro/competencia.ts";
import {
  diasAte,
  situacaoPrazo,
  prazosQueExigemAtencao,
} from "../../lib/juridico/prazos.ts";
import { calcularRepasse } from "../../lib/repasses/calculo.ts";
import { dataNoFuso, dataSomandoDias } from "../../lib/datas.ts";

describe("soma de dias em datas", () => {
  test("cruza fim de mês e de ano", () => {
    assert.equal(dataSomandoDias("2026-10-28", 7), "2026-11-04");
    assert.equal(dataSomandoDias("2026-12-30", 5), "2027-01-04");
    assert.equal(dataSomandoDias("2028-02-24", 5), "2028-02-29");
  });
});

describe("datas no fuso do escritório", () => {
  test("à noite em MS a data continua sendo a do dia, não a do UTC seguinte", () => {
    // 2026-10-01 23:30 em Campo Grande (UTC-4) = 2026-10-02 03:30 UTC
    assert.equal(dataNoFuso(new Date("2026-10-02T03:30:00Z")), "2026-10-01");
  });
  test("virada de mês respeitada no fuso local", () => {
    // 2026-09-30 22:00 em Campo Grande = 2026-10-01 02:00 UTC
    assert.equal(dataNoFuso(new Date("2026-10-01T02:00:00Z")), "2026-09-30");
  });
  test("de dia, a data coincide com a UTC", () => {
    assert.equal(dataNoFuso(new Date("2026-10-01T15:00:00Z")), "2026-10-01");
  });
});

describe("busca de clientes", () => {
  test("remove caracteres que quebrariam o filtro .or do PostgREST", () => {
    assert.equal(termoSeguro("Silva, (João)"), "Silva   João");
    assert.equal(termoSeguro("100%_ok*"), "100  ok");
  });
  test("texto comum passa intacto", () => {
    assert.equal(termoSeguro("  Maria Souza "), "Maria Souza");
  });
});

describe("WhatsApp", () => {
  test("celular com máscara vira link com DDI 55", () => {
    assert.equal(linkWhatsApp("(67) 99850-0610"), "https://wa.me/5567998500610");
  });
  test("número já com DDI 55 não recebe outro", () => {
    assert.equal(linkWhatsApp("+55 67 99850-0610"), "https://wa.me/5567998500610");
  });
  test("número curto demais não gera link", () => {
    assert.equal(linkWhatsApp("9999"), null);
  });
});

describe("competência", () => {
  test("monta e normaliza competências", () => {
    assert.equal(competenciaDe(2026, 9), "2026-09-01");
    assert.equal(parseCompetencia("2026-09"), "2026-09-01");
    assert.equal(parseCompetencia("2026-09-15"), "2026-09-01");
    assert.equal(parseCompetencia("2026-13"), null);
    assert.equal(parseCompetencia("lixo"), null);
    assert.equal(parseCompetencia(undefined), null);
  });
  test("navega entre meses cruzando o ano", () => {
    assert.equal(deslocarCompetencia("2026-01-01", -1), "2025-12-01");
    assert.equal(deslocarCompetencia("2026-12-01", 1), "2027-01-01");
    assert.equal(deslocarCompetencia("2026-02-01", 0), "2026-02-01");
  });
  test("intervalo do mês respeita o último dia (inclusive fevereiro bissexto)", () => {
    assert.deepEqual(intervaloCompetencia("2026-09-01"), { inicio: "2026-09-01", fim: "2026-09-30" });
    assert.deepEqual(intervaloCompetencia("2028-02-01"), { inicio: "2028-02-01", fim: "2028-02-29" });
    assert.deepEqual(intervaloCompetencia("2026-02-01"), { inicio: "2026-02-01", fim: "2026-02-28" });
  });
  test("rótulo em português", () => {
    assert.equal(rotuloCompetencia("2026-09-01"), "Setembro de 2026");
  });
});

describe("prazos processuais", () => {
  const hoje = "2026-10-05";
  test("conta dias sem sofrer com fuso ou horário de verão", () => {
    assert.equal(diasAte("2026-10-10", hoje), 5);
    assert.equal(diasAte("2026-10-01", hoje), -4);
    assert.equal(diasAte("2026-10-05", hoje), 0);
  });
  test("classifica vencido, urgente, próximo e no prazo", () => {
    assert.equal(situacaoPrazo({ data_prazo: "2026-10-04", concluido: false }, hoje), "vencido");
    assert.equal(situacaoPrazo({ data_prazo: "2026-10-05", concluido: false }, hoje), "urgente");
    assert.equal(situacaoPrazo({ data_prazo: "2026-10-10", concluido: false }, hoje), "urgente");
    assert.equal(situacaoPrazo({ data_prazo: "2026-10-15", concluido: false }, hoje), "proximo");
    assert.equal(situacaoPrazo({ data_prazo: "2026-11-30", concluido: false }, hoje), "no_prazo");
  });
  test("prazo concluído nunca é alerta, mesmo vencido", () => {
    assert.equal(situacaoPrazo({ data_prazo: "2026-10-01", concluido: true }, hoje), "concluido");
  });
  test("bloco URGENTE só recebe vencidos e urgentes não concluídos", () => {
    const lista = [
      { id: "a", data_prazo: "2026-10-01", concluido: false },
      { id: "b", data_prazo: "2026-10-08", concluido: false },
      { id: "c", data_prazo: "2026-10-08", concluido: true },
      { id: "d", data_prazo: "2026-10-20", concluido: false },
    ];
    assert.deepEqual(prazosQueExigemAtencao(lista, hoje).map((p) => p.id), ["a", "b"]);
  });
});

describe("cálculo de repasse", () => {
  test("aluguel bruto, taxa de administração e despesas repassáveis", () => {
    const r = calcularRepasse({
      alugueisPagos: [{ descricao: "Casa Rua A", valor: 1000 }, { descricao: "Apto B", valor: 1500 }],
      despesasRepassaveis: [{ descricao: "Reparo hidráulico", valor: 200 }],
      comissaoPercentual: 10,
    });
    assert.equal(r.valor_bruto, 2500);
    assert.equal(r.taxa_administracao, 250);
    assert.equal(r.total_despesas, 200);
    assert.equal(r.valor_liquido, 2050);
    assert.equal(r.itens.length, 4);
    assert.equal(r.itens.filter((i) => i.sinal === "credito").length, 2);
  });

  test("sem aluguel pago o repasse é zero e não há taxa", () => {
    const r = calcularRepasse({ alugueisPagos: [], despesasRepassaveis: [], comissaoPercentual: 10 });
    assert.deepEqual(
      [r.valor_bruto, r.taxa_administracao, r.total_despesas, r.valor_liquido],
      [0, 0, 0, 0]
    );
    assert.equal(r.itens.length, 0);
  });

  test("arredondamento em centavos, sem erro de ponto flutuante", () => {
    const r = calcularRepasse({
      alugueisPagos: [{ descricao: "X", valor: 0.1 }, { descricao: "Y", valor: 0.2 }],
      despesasRepassaveis: [],
      comissaoPercentual: 10,
    });
    assert.equal(r.valor_bruto, 0.3);
    assert.equal(r.taxa_administracao, 0.03);
    assert.equal(r.valor_liquido, 0.27);
  });

  test("despesa maior que o aluguel gera líquido negativo, que o chamador deve tratar", () => {
    const r = calcularRepasse({
      alugueisPagos: [{ descricao: "X", valor: 100 }],
      despesasRepassaveis: [{ descricao: "Obra", valor: 500 }],
      comissaoPercentual: 10,
    });
    assert.equal(r.valor_liquido, -410);
  });
});
