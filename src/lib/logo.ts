import fs from "node:fs";
import path from "node:path";

/**
 * O logótipo do utilizador é servido por `/api/logo/[variante]`, não como
 * ficheiro estático: o `next start` só serve o conteúdo de `public/` que existia
 * quando arrancou, e queremos que o upload apareça de imediato.
 *
 * Procura primeiro em `data/` (onde o upload é guardado, junto da base de dados
 * e por isso incluído nas cópias de segurança) e depois em `public/`, para quem
 * preferir copiar o ficheiro à mão.
 */
const EXTENSOES = ["svg", "png", "webp", "jpg", "jpeg"] as const;

export const VARIANTES = ["claro", "escuro"] as const;
export type Variante = (typeof VARIANTES)[number];

const BASE: Record<Variante, string> = { claro: "logo", escuro: "logo-branco" };

export function pastaDados() {
  const bd = process.env.ESDEV_DB ?? path.join(process.cwd(), "data", "esdev.db");
  return path.dirname(bd);
}

/** Caminho no disco do logótipo de uma variante, se existir. */
export function ficheiroLogotipo(variante: Variante): string | null {
  for (const pasta of [pastaDados(), path.join(process.cwd(), "public")]) {
    for (const ext of EXTENSOES) {
      const caminho = path.join(pasta, `${BASE[variante]}.${ext}`);
      if (fs.existsSync(caminho)) return caminho;
    }
  }
  return null;
}

export type Logotipos = {
  claro: string | null;
  escuro: string | null;
  /** Só preenchido quando existe um ficheiro dedicado a fundos escuros. */
  escuroProprio: string | null;
};

function url(variante: Variante): string | null {
  const ficheiro = ficheiroLogotipo(variante);
  if (!ficheiro) return null;
  // O sufixo evita que o browser mostre um logótipo antigo em cache.
  return `/api/logo/${variante}?v=${Math.round(fs.statSync(ficheiro).mtimeMs)}`;
}

export function logotipos(): Logotipos {
  const claro = url("claro");
  const escuroProprio = url("escuro");
  return { claro, escuro: escuroProprio ?? claro, escuroProprio };
}
