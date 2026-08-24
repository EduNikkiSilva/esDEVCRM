import fs from "node:fs";
import path from "node:path";
import { consulta } from "@/lib/db";

/**
 * O logótipo é guardado na base de dados, não no disco: em alojamento serverless
 * o sistema de ficheiros é só de leitura e é descartado a cada publicação. Como
 * bónus, o logótipo passa a viajar nas cópias de segurança da base de dados.
 *
 * Continua a ser possível colocar ficheiros à mão em `public/logo.png` e
 * `public/logo-branco.png` — servem de alternativa para quem preferir isso.
 */
export const VARIANTES = ["claro", "escuro"] as const;
export type Variante = (typeof VARIANTES)[number];

export const CHAVE: Record<Variante, string> = {
  claro: "logo",
  escuro: "logo-branco",
};

const EXTENSOES = ["svg", "png", "webp", "jpg", "jpeg"] as const;

const TIPOS_POR_EXTENSAO: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export type Ficheiro = { tipo: string; dados: Uint8Array };

/** Procura na base de dados e, em alternativa, num ficheiro colocado em public/. */
export async function lerLogotipo(variante: Variante): Promise<Ficheiro | null> {
  const linhas = await consulta<{ tipo: string; dados: Uint8Array }>(
    "SELECT tipo, dados FROM ficheiros WHERE chave = ?",
    CHAVE[variante],
  );
  if (linhas[0]) return { tipo: linhas[0].tipo, dados: linhas[0].dados };

  for (const ext of EXTENSOES) {
    const caminho = path.join(process.cwd(), "public", `${CHAVE[variante]}.${ext}`);
    if (fs.existsSync(caminho)) {
      return { tipo: TIPOS_POR_EXTENSAO[ext], dados: fs.readFileSync(caminho) };
    }
  }
  return null;
}

export type Logotipos = {
  claro: string | null;
  escuro: string | null;
  /** Só preenchido quando existe uma versão dedicada a fundos escuros. */
  escuroProprio: string | null;
};

/** URLs a usar nas imagens, com sufixo que evita cache desatualizada. */
export async function logotipos(): Promise<Logotipos> {
  const guardados = await consulta<{ chave: string; atualizado_em: string }>(
    "SELECT chave, atualizado_em FROM ficheiros WHERE chave = ? OR chave = ?",
    CHAVE.claro,
    CHAVE.escuro,
  );

  const url = async (variante: Variante) => {
    const guardado = guardados.find((g) => g.chave === CHAVE[variante]);
    if (guardado) {
      const versao = Date.parse(guardado.atualizado_em) || guardado.atualizado_em.length;
      return `/api/logo/${variante}?v=${versao}`;
    }
    return (await lerLogotipo(variante)) ? `/api/logo/${variante}` : null;
  };

  const claro = await url("claro");
  const escuroProprio = await url("escuro");
  return { claro, escuro: escuroProprio ?? claro, escuroProprio };
}
