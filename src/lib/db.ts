import fs from "node:fs";
import path from "node:path";

/**
 * Camada de dados com dois motores, escolhidos pelo ambiente:
 *
 *   DATABASE_URL definido  →  PostgreSQL (produção: Neon na Vercel)
 *   DATABASE_URL ausente   →  SQLite embutido no Node, num ficheiro local
 *
 * O SQL é escrito uma vez, com `?` como marcador de parâmetro e com as funções
 * de data abstraídas em `AGORA` e `HOJE`. O adaptador de Postgres traduz os `?`
 * para `$1, $2, …` e acrescenta `RETURNING id` aos INSERT, para `lastInsertRowid`
 * funcionar igual nos dois motores.
 *
 * Todas as funções são assíncronas: o cliente de Postgres é sempre assíncrono e
 * ter uma única assinatura evita duas versões de cada consulta.
 */
/**
 * As integrações de alojamento usam nomes diferentes para a mesma coisa: a Neon
 * na Vercel define DATABASE_URL, a Supabase define POSTGRES_URL. Aceitamos os
 * dois para não haver configuração silenciosamente ignorada.
 */
export const urlPostgres =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;

export const usaPostgres = Boolean(urlPostgres);

const caminho = process.env.ESDEV_DB ?? path.join(process.cwd(), "data", "esdev.db");

export const caminhoBaseDados = usaPostgres
  ? (urlPostgres ?? "").replace(/:[^:@/]+@/, ":•••@")
  : caminho;

/** Expressões dependentes do motor, para o SQL das consultas ser único. */
export const AGORA = usaPostgres ? "now()::text" : "datetime('now')";
export const HOJE = usaPostgres ? "current_date::text" : "date('now')";
/** Ordenação por data: as datas são guardadas em texto ISO nos dois motores. */
export const semAcento = (coluna: string) => (usaPostgres ? `lower(${coluna})` : `${coluna} COLLATE NOCASE`);

/** As datas são texto ISO nos dois motores, logo os 7 primeiros caracteres são o mês. */
export const mesDe = (coluna: string) => `substr(${coluna}, 1, 7)`;

type Parametro = string | number | bigint | null | Uint8Array;
export type Resultado = { changes: number; lastInsertRowid: number | bigint };

const normalizar = (params: unknown[]): Parametro[] =>
  params.map((p) => {
    if (p === undefined) return null;
    // O SQLite do Node não aceita booleanos.
    if (typeof p === "boolean") return p ? 1 : 0;
    return p as Parametro;
  });

/** O node:sqlite devolve linhas com protótipo nulo; o React recusa passá-las. */
const simples = <T,>(linha: unknown): T => ({ ...(linha as object) }) as T;

// --- Adaptador: PostgreSQL ---------------------------------------------------

type Cliente = {
  query: (
    sql: string,
    valores?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
};

declare global {
  var __esdevPg: Promise<Cliente> | undefined;
  var __esdevSqlite: import("node:sqlite").DatabaseSync | undefined;
}

const paraDolares = (sql: string) => {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
};

/**
 * Instruções de `db/alteracoes.sql`, uma a uma. São ADD COLUMN e CREATE INDEX
 * sobre tabelas que já podem existir sem essas colunas: falhar é o resultado
 * normal quando já foram aplicadas, por isso o erro é ignorado.
 */
function alteracoes(): string[] {
  return fs
    .readFileSync(path.join(process.cwd(), "db", "alteracoes.sql"), "utf8")
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim())
    .filter(Boolean);
}



async function pool(): Promise<Cliente> {
  if (!globalThis.__esdevPg) {
    // Se a ligação falhar, a promessa rejeitada NÃO fica em cache: senão um erro
    // de configuração continuava a dar erro depois de corrigido, até reiniciar.
    globalThis.__esdevPg = (async () => {
      const { Pool } = await import("pg");
      const p = new Pool({
        connectionString: urlPostgres,
        // Os fornecedores geridos (Neon, Supabase) exigem TLS.
        ssl: /localhost|127\.0\.0\.1/.test(urlPostgres ?? "") ? undefined : { rejectUnauthorized: false },
        // O pooler da Supabase em modo transação não gosta de muitas ligações
        // paralelas por instância; cinco é folgado para um utilizador.
        max: 5,
      });
      await p.query(fs.readFileSync(path.join(process.cwd(), "db", "schema.postgres.sql"), "utf8"));
      for (const instrucao of alteracoes()) {
        try {
          await p.query(instrucao);
        } catch {
          // Coluna ou índice já existentes.
        }
      }
      return p as unknown as Cliente;
    })().catch((erro) => {
      globalThis.__esdevPg = undefined;
      throw erro;
    });
  }
  return globalThis.__esdevPg;
}

// --- Adaptador: SQLite ------------------------------------------------------

async function sqlite() {
  if (!globalThis.__esdevSqlite) {
    // Em alojamento sem disco persistente (Vercel), o SQLite não serve para nada:
    // o ficheiro seria apagado a cada publicação — e a pasta é só de leitura.
    if (process.env.VERCEL) {
      throw new Error(
        "DATABASE_URL não está definida. Num alojamento sem disco persistente é obrigatória: " +
          "cria a base de dados (Supabase ou Neon), define DATABASE_URL e republica.",
      );
    }
    const { DatabaseSync } = await import("node:sqlite");
    fs.mkdirSync(path.dirname(caminho), { recursive: true });
    const bd = new DatabaseSync(caminho);
    bd.exec("PRAGMA journal_mode = WAL");
    bd.exec("PRAGMA foreign_keys = ON");
    bd.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
    for (const instrucao of alteracoes()) {
      try {
        bd.exec(instrucao);
      } catch {
        // Coluna ou índice já existentes.
      }
    }
    globalThis.__esdevSqlite = bd;
  }
  return globalThis.__esdevSqlite;
}

// --- API pública ------------------------------------------------------------

export async function consulta<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const valores = normalizar(params);
  if (usaPostgres) {
    const { rows } = await (await pool()).query(paraDolares(sql), valores);
    return rows as T[];
  }
  return (await sqlite())
    .prepare(sql)
    .all(...valores)
    .map((linha) => simples<T>(linha));
}

export async function primeiro<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T | undefined> {
  const linhas = await consulta<T>(sql, ...params);
  return linhas[0];
}

export async function executa(sql: string, ...params: unknown[]): Promise<Resultado> {
  const valores = normalizar(params);
  if (usaPostgres) {
    const { rows, rowCount } = await (await pool()).query(paraDolares(sql), valores);
    return {
      changes: rowCount ?? 0,
      lastInsertRowid: Number((rows[0] as { id?: number } | undefined)?.id ?? 0),
    };
  }
  const r = (await sqlite()).prepare(sql).run(...valores);
  return { changes: Number(r.changes), lastInsertRowid: r.lastInsertRowid };
}

/**
 * INSERT cujo id gerado é necessário. Em Postgres acrescenta `RETURNING id`;
 * é explícito de propósito, porque há tabelas sem coluna `id` (como `ficheiros`,
 * cuja chave primária é o nome do ficheiro).
 */
export async function insere(sql: string, ...params: unknown[]): Promise<Resultado> {
  return executa(usaPostgres && !/returning/i.test(sql) ? `${sql} RETURNING id` : sql, ...params);
}
