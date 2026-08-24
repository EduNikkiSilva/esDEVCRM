/**
 * Testes do motor de preços. Sem servidor, sem base de dados.
 *
 *   npm run teste-precos
 */
import assert from "node:assert/strict";
import {
  INPUTS_INICIAIS,
  PACOTES,
  VALOR_HORA_ALVO,
  VALOR_HORA_INTERNO,
  calcularPreco,
} from "../src/lib/pricing.ts";

const resultados: { nome: string; ok: boolean; detalhe?: string }[] = [];

function teste(nome: string, fn: () => void) {
  try {
    fn();
    resultados.push({ nome, ok: true });
    console.log(`PASSOU  ${nome}`);
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e);
    resultados.push({ nome, ok: false, detalhe });
    console.log(`FALHOU  ${nome} — ${detalhe}`);
  }
}

teste("pacote web-business tem recomendado 1600 €", () => {
  const p = PACOTES.find((x) => x.id === "web-business");
  assert.ok(p);
  assert.equal(p.recomendado, 1600);
  assert.equal(p.minimo, 1200);
  assert.equal(p.premium, 2100);
});

teste("piso/alvo de rentabilidade (meio da faixa freelancer)", () => {
  assert.equal(VALOR_HORA_INTERNO, 32);
  assert.equal(VALOR_HORA_ALVO, 45);
});

teste("inputs iniciais produzem preço técnico >= base do pacote", () => {
  const r = calcularPreco(INPUTS_INICIAIS);
  assert.equal(r.pacote.id, "web-business");
  assert.ok(r.precoTecnico.recomendado >= r.base.recomendado);
  assert.ok(r.precoFinal.recomendado > 0);
  assert.ok(r.valorHora > 0);
});

teste("urgência 5 acresce ~30% face a urgência 1 (resto igual)", () => {
  const base = calcularPreco({ ...INPUTS_INICIAIS, urgencia: 1, risco: 1, prioritario: false });
  const urgente = calcularPreco({ ...INPUTS_INICIAIS, urgencia: 5, risco: 1, prioritario: false });
  const razao = urgente.precoTecnico.recomendado / base.precoTecnico.recomendado;
  assert.ok(razao > 1.25 && razao < 1.35, `razão=${razao}`);
});

teste("prioritário acresce 10%", () => {
  const normal = calcularPreco({ ...INPUTS_INICIAIS, prioritario: false, urgencia: 1, risco: 1 });
  const prio = calcularPreco({ ...INPUTS_INICIAIS, prioritario: true, urgencia: 1, risco: 1 });
  const razao = prio.precoTecnico.recomendado / normal.precoTecnico.recomendado;
  assert.ok(Math.abs(razao - 1.1) < 0.02, `razão=${razao}`);
});

teste("extra página-simples aumenta o escalão de extras", () => {
  const sem = calcularPreco(INPUTS_INICIAIS);
  const com = calcularPreco({
    ...INPUTS_INICIAIS,
    extras: { "pagina-simples": 2 },
  });
  assert.equal(com.linhasExtras.length, 1);
  assert.equal(com.linhasExtras[0].quantidade, 2);
  assert.ok(com.extras.recomendado > sem.extras.recomendado);
  assert.ok(com.precoFinal.recomendado > sem.precoFinal.recomendado);
});

teste("custos externos somam ao preço técnico e ao final", () => {
  const sem = calcularPreco({ ...INPUTS_INICIAIS, custosExternos: 0 });
  const com = calcularPreco({ ...INPUTS_INICIAIS, custosExternos: 200 });
  assert.ok(com.precoTecnico.recomendado >= sem.precoTecnico.recomendado + 200 - 10);
  assert.ok(com.precoFinal.recomendado >= sem.precoFinal.recomendado + 200 - 10);
});

teste("horas baixas → rentabilidade abaixo do piso", () => {
  const r = calcularPreco({
    ...INPUTS_INICIAIS,
    pacoteId: "landing",
    horasEstimadas: 80,
    urgencia: 1,
    risco: 1,
    prioritario: false,
  });
  // 550 € / 80 h ≈ 6,9 €/h → abaixo do piso 32
  assert.equal(r.nivelRentabilidade, "abaixo");
  assert.equal(r.rentabilidadeOk, false);
});

teste("horas realistas → rentabilidade aceitável ou boa", () => {
  const r = calcularPreco({
    ...INPUTS_INICIAIS,
    pacoteId: "web-business",
    horasEstimadas: 35,
    urgencia: 1,
    risco: 1,
    prioritario: false,
  });
  assert.ok(r.nivelRentabilidade === "aceitavel" || r.nivelRentabilidade === "bom");
  assert.equal(r.rentabilidadeOk, true);
});

teste("pacote desconhecido cai no fallback (web-business)", () => {
  const r = calcularPreco({ ...INPUTS_INICIAIS, pacoteId: "nao-existe" });
  assert.equal(r.pacote.id, "web-business");
});

const falhas = resultados.filter((x) => !x.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} testes passaram`);
process.exit(falhas.length ? 1 : 0);
