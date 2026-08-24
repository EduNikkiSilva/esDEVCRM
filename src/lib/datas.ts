/**
 * Aritmética de datas sobre texto ISO `AAAA-MM-DD`, que é o formato guardado nos
 * dois motores. Trabalhar em texto evita a armadilha do fuso horário: um
 * `new Date("2026-08-24")` é meia-noite UTC e em Portugal pode render o dia 23.
 */

import { MESES_CICLO, type Periodicidade } from "@/lib/dominio";

/** Data de hoje em hora local, não UTC. */
export function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const paraData = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);

const paraIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function somarDias(iso: string, dias: number): string {
  const d = paraData(iso);
  d.setDate(d.getDate() + dias);
  return paraIso(d);
}

export function somarMeses(iso: string, meses: number): string {
  const d = paraData(iso);
  const dia = d.getDate();
  d.setMonth(d.getMonth() + meses);
  // 31 de janeiro + 1 mês daria 3 de março; queremos o último dia de fevereiro.
  if (d.getDate() < dia) d.setDate(0);
  return paraIso(d);
}

/** Dias de `iso` até hoje. Negativo quando a data já passou. */
export function diasAte(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const dia = 24 * 60 * 60 * 1000;
  return Math.round((paraData(iso).getTime() - paraData(hoje()).getTime()) / dia);
}

/** Próxima renovação a partir de um início e de uma periodicidade. */
export function proximaRenovacao(inicio: string | null, periodicidade: string): string | null {
  if (!inicio) return null;
  const passo = MESES_CICLO[periodicidade as Periodicidade] ?? 1;
  let data = inicio.slice(0, 10);
  const limite = hoje();
  // Um serviço antigo pode ter dezenas de ciclos; o limite evita ciclos infinitos
  // se a periodicidade vier corrompida.
  for (let i = 0; i < 600 && data <= limite; i++) data = somarMeses(data, passo);
  return data;
}

/** Valor normalizado a mês, para somar MRR de ciclos diferentes. */
export const mensalizar = (valor: number, periodicidade: string) =>
  valor / (MESES_CICLO[periodicidade as Periodicidade] ?? 1);
