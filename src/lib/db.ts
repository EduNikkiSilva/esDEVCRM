import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Base de dados local em ficheiro, através do SQLite embutido no Node
 * (`node:sqlite`). É de propósito que não usamos um módulo nativo como o
 * better-sqlite3: em Windows este exige o Visual Studio com as ferramentas de
 * C++ para compilar, e isso tornava a instalação impossível sem 6 GB de
 * dependências. Requer Node 22.13 ou superior.
 *
 * Fica em ./data/esdev.db por omissão, ou no caminho definido em ESDEV_DB.
 */
const caminho = process.env.ESDEV_DB ?? path.join(process.cwd(), "data", "esdev.db");

declare global {
  var __esdevDb: DatabaseSync | undefined;
}

function abrir(): DatabaseSync {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
  return db;
}

export const db: DatabaseSync = globalThis.__esdevDb ?? abrir();
if (process.env.NODE_ENV !== "production") globalThis.__esdevDb = db;

export const caminhoBaseDados = caminho;

type Parametro = string | number | bigint | null | Uint8Array;

const normalizar = (params: unknown[]): Parametro[] =>
  params.map((p) => (p === undefined ? null : (p as Parametro)));

/**
 * O node:sqlite devolve linhas com protótipo nulo, e o React recusa passá-las de
 * um Server Component para um componente de cliente. Convertemos aqui, uma vez.
 */
const simples = <T,>(linha: unknown): T => ({ ...(linha as object) }) as T;

export function consulta<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db
    .prepare(sql)
    .all(...normalizar(params))
    .map((linha) => simples<T>(linha));
}

export function primeiro<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T | undefined {
  const linha = db.prepare(sql).get(...normalizar(params));
  return linha === undefined ? undefined : simples<T>(linha);
}

export function executa(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...normalizar(params));
}
