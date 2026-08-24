import { consulta } from "@/lib/db";

/**
 * Tabelas de negócio a incluir no backup. A ordem não importa para o JSON;
 * `ficheiros` vai à parte porque os BLOB são convertidos em base64.
 */
const TABELAS = [
  "clientes",
  "leads",
  "briefings",
  "analises",
  "propostas",
  "projetos",
  "faturas",
  "manutencoes",
  "tarefas",
  "atividades",
  "contactos",
  "contratos",
  "servicos_recorrentes",
  "acessos",
] as const;

export type Backup = {
  versao: 1;
  gerado_em: string;
  origem: string;
  tabelas: Record<string, Record<string, unknown>[]>;
  ficheiros: { chave: string; tipo: string; dados_base64: string; atualizado_em: string }[];
};

/** Snapshot completo do CRM, transportável entre SQLite e Postgres. */
export async function gerarBackup(origem: string): Promise<Backup> {
  const tabelas: Backup["tabelas"] = {};
  for (const nome of TABELAS) {
    try {
      tabelas[nome] = await consulta(`SELECT * FROM ${nome}`);
    } catch {
      // Tabela ainda não existe nesta instalação (schema antigo).
      tabelas[nome] = [];
    }
  }

  let ficheiros: Backup["ficheiros"] = [];
  try {
    const linhas = await consulta<{
      chave: string;
      tipo: string;
      dados: Uint8Array | Buffer;
      atualizado_em: string;
    }>("SELECT chave, tipo, dados, atualizado_em FROM ficheiros");
    ficheiros = linhas.map((f) => ({
      chave: f.chave,
      tipo: f.tipo,
      dados_base64: Buffer.from(f.dados).toString("base64"),
      atualizado_em: f.atualizado_em,
    }));
  } catch {
    ficheiros = [];
  }

  return {
    versao: 1,
    gerado_em: new Date().toISOString(),
    origem,
    tabelas,
    ficheiros,
  };
}

export function nomeFicheiroBackup(quando = new Date()) {
  const iso = quando.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `esdevcrm-backup-${iso}.json`;
}
