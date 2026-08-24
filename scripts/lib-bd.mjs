/**
 * Acesso à base de dados para os scripts de linha de comandos, com os mesmos dois
 * motores da aplicação: PostgreSQL quando DATABASE_URL existe, SQLite caso contrário.
 */
import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();
export const urlPostgres =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
export const usaPostgres = Boolean(urlPostgres);

const paraDolares = (sql) => {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
};

const precisaReturning = (sql) => /^\s*insert\s/i.test(sql) && !/returning/i.test(sql);

/** Ver db/alteracoes.sql: ADD COLUMN/CREATE INDEX idempotentes, erros ignorados. */
const alteracoes = () =>
  fs
    .readFileSync(path.join(raiz, "db", "alteracoes.sql"), "utf8")
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim())
    .filter(Boolean);

export async function abrir() {
  if (usaPostgres) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: urlPostgres,
      ssl: /localhost|127\.0\.0\.1/.test(urlPostgres) ? undefined : { rejectUnauthorized: false },
    });
    await pool.query(fs.readFileSync(path.join(raiz, "db", "schema.postgres.sql"), "utf8"));
    for (const instrucao of alteracoes()) {
      try {
        await pool.query(instrucao);
      } catch {}
    }

    return {
      etiqueta: urlPostgres.replace(/:[^:@/]+@/, ":•••@"),
      consulta: async (sql, ...p) => (await pool.query(paraDolares(sql), p)).rows,
      executa: async (sql, ...p) => {
        // Os scripts inserem sempre em tabelas com coluna id.
        const texto = precisaReturning(sql) ? `${sql} RETURNING id` : sql;
        const r = await pool.query(paraDolares(texto), p);
        return { lastInsertRowid: r.rows[0]?.id ?? 0, changes: r.rowCount ?? 0 };
      },
      exec: async (sql) => void (await pool.query(sql)),
      fechar: () => pool.end(),
    };
  }

  const { DatabaseSync } = await import("node:sqlite");
  const caminho = process.env.ESDEV_DB ?? path.join(raiz, "data", "esdev.db");
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8"));
  for (const instrucao of alteracoes()) {
    try {
      db.exec(instrucao);
    } catch {}
  }

  return {
    etiqueta: caminho,
    consulta: async (sql, ...p) => db.prepare(sql).all(...p).map((l) => ({ ...l })),
    executa: async (sql, ...p) => db.prepare(sql).run(...p),
    exec: async (sql) => db.exec(sql),
    fechar: () => db.close(),
  };
}

export const TABELAS = [
  "atividades",
  "contratos",
  "servicos_recorrentes",
  "contactos",
  "tarefas",
  "faturas",
  "manutencoes",
  "propostas",
  "analises",
  "briefings",
  "projetos",
  "leads",
  "clientes",
];
