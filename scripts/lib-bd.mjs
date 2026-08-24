/**
 * Acesso à base de dados para os scripts de linha de comandos, com os mesmos dois
 * motores da aplicação: PostgreSQL quando DATABASE_URL existe, SQLite caso contrário.
 */
import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();
export const usaPostgres = Boolean(process.env.DATABASE_URL);

const paraDolares = (sql) => {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
};

const precisaReturning = (sql) => /^\s*insert\s/i.test(sql) && !/returning/i.test(sql);

export async function abrir() {
  if (usaPostgres) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
        ? undefined
        : { rejectUnauthorized: false },
    });
    await pool.query(fs.readFileSync(path.join(raiz, "db", "schema.postgres.sql"), "utf8"));

    return {
      etiqueta: process.env.DATABASE_URL.replace(/:[^:@/]+@/, ":•••@"),
      consulta: async (sql, ...p) => (await pool.query(paraDolares(sql), p)).rows,
      executa: async (sql, ...p) => {
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

  return {
    etiqueta: caminho,
    consulta: async (sql, ...p) => db.prepare(sql).all(...p).map((l) => ({ ...l })),
    executa: async (sql, ...p) => db.prepare(sql).run(...p),
    exec: async (sql) => db.exec(sql),
    fechar: () => db.close(),
  };
}

export const TABELAS = [
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
