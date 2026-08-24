import fs from "node:fs";
import path from "node:path";

/**
 * Procura o logótipo original em `public/`. Se existir, a aplicação usa a
 * imagem; se não, usa a versão vetorial de `components/logotipo.tsx`.
 *
 *   public/logo.png          → fundos claros (e fallback geral)
 *   public/logo-branco.png   → fundos escuros, como a barra lateral
 *
 * Aceita .svg, .png e .webp.
 */
const EXTENSOES = ["svg", "png", "webp"] as const;

function procurar(base: string): string | null {
  for (const ext of EXTENSOES) {
    const ficheiro = `${base}.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", ficheiro))) return `/${ficheiro}`;
  }
  return null;
}

export type Logotipos = { claro: string | null; escuro: string | null };

export function logotipos(): Logotipos {
  const claro = procurar("logo");
  const escuro = procurar("logo-branco") ?? claro;
  return { claro, escuro };
}
