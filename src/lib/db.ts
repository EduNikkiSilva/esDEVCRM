import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/**
 * Base de dados local em ficheiro. Fica em ./data/esdev.db por omissão, ou no
 * caminho definido em ESDEV_DB. Nada sai do computador.
 */
const caminho = process.env.ESDEV_DB ?? path.join(process.cwd(), "data", "esdev.db");


declare global {
  var __esdevDb: Database.Database | undefined;
}

function abrir(): Database.Database {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const db = new Database(caminho);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
  return db;
}

export const db: Database.Database = globalThis.__esdevDb ?? abrir();
if (process.env.NODE_ENV !== "production") globalThis.__esdevDb = db;

export const caminhoBaseDados = caminho;

export function consulta<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...(params as never[])) as T[];
}

export function primeiro<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T | undefined {
  return db.prepare(sql).get(...(params as never[])) as T | undefined;
}

export function executa(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...(params as never[]));
}
