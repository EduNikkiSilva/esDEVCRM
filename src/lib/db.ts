import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Base de dados local em ficheiro, através do SQLite embutido no Node
 * (`node:sqlite`). É de propósito que não usamos um módulo nativo como o
 * better-sqlite3: em Windows este exige o Visual Studio com as ferramentas de
 * C++ para compilar, e isso tornava a instalação impossível sem vários GB de
 * dependências. Requer Node 22.13 ou superior.
 *
 * Fica em ./data/esdev.db por omissão, ou no caminho definido em ESDEV_DB.
 *
 * A ligação é aberta na primeira consulta, não ao importar o módulo: durante o
 * `next build` há vários processos a analisar páginas em paralelo e abrir aqui a
 * base de dados fazia-os competir para a criar.
 */
const caminho = process.env.ESDEV_DB ?? path.join(process.cwd(), "data", "esdev.db");

declare global {
  var __esdevDb: DatabaseSync | undefined;
}

export const caminhoBaseDados = caminho;

function abrir(): DatabaseSync {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const bd = new DatabaseSync(caminho);
  bd.exec("PRAGMA journal_mode = WAL");
  bd.exec("PRAGMA foreign_keys = ON");
  bd.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
  return bd;
}

function ligacao(): DatabaseSync {
  if (!globalThis.__esdevDb) globalThis.__esdevDb = abrir();
  return globalThis.__esdevDb;
}

type Parametro = string | number | bigint | null | Uint8Array;

const normalizar = (params: unknown[]): Parametro[] =>
  params.map((p) => (p === undefined ? null : (p as Parametro)));

/**
 * O node:sqlite devolve linhas com protótipo nulo, e o React recusa passá-las de
 * um Server Component para um componente de cliente. Convertemos aqui, uma vez.
 */
const simples = <T,>(linha: unknown): T => ({ ...(linha as object) }) as T;

export function consulta<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return ligacao()
    .prepare(sql)
    .all(...normalizar(params))
    .map((linha) => simples<T>(linha));
}

export function primeiro<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T | undefined {
  const linha = ligacao()
    .prepare(sql)
    .get(...normalizar(params));
  return linha === undefined ? undefined : simples<T>(linha);
}

export function executa(sql: string, ...params: unknown[]) {
  return ligacao()
    .prepare(sql)
    .run(...normalizar(params));
}
