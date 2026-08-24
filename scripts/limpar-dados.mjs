/**
 * Apaga TODOS os registos do CRM — leads, briefings, análises, propostas,
 * projetos, tarefas, faturas e contratos de manutenção — deixando a base de
 * dados vazia e os contadores de id a começar em 1.
 *
 * O logótipo que carregaste fica intacto: vive na mesma pasta, mas é um ficheiro
 * separado da base de dados.
 *
 *   npm run limpar-dados              # mostra o que existe e não apaga nada
 *   npm run limpar-dados -- --sim     # apaga a sério
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const caminho = process.env.ESDEV_DB ?? path.join(process.cwd(), "data", "esdev.db");

if (!fs.existsSync(caminho)) {
  console.log(`Não existe base de dados em ${caminho}. Já está tudo a zero.`);
  process.exit(0);
}

const db = new DatabaseSync(caminho);
db.exec("PRAGMA foreign_keys = OFF");

// Ordem inversa das dependências, para não haver referências penduradas.
const TABELAS = [
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

const contar = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
const antes = TABELAS.map((t) => [t, contar(t)]);
const total = antes.reduce((s, [, n]) => s + n, 0);

console.log(`Base de dados: ${caminho}\n`);
for (const [t, n] of antes) console.log(`  ${t.padEnd(14)} ${n}`);
console.log(`\n  total          ${total} registo(s)\n`);

if (total === 0) {
  console.log("Já está tudo a zero.");
  process.exit(0);
}

if (!process.argv.includes("--sim")) {
  console.log("Nada foi apagado. Para apagar a sério:\n");
  console.log("  npm run limpar-dados -- --sim\n");
  process.exit(0);
}

for (const t of TABELAS) db.prepare(`DELETE FROM ${t}`).run();
// Reinicia os ids para o próximo registo ser o número 1.
db.prepare("DELETE FROM sqlite_sequence").run();
db.exec("VACUUM");

console.log("Apagado. O CRM está vazio e os ids começam de novo em 1.");
