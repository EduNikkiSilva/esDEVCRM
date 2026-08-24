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
import { TABELAS, abrir, usaPostgres } from "./lib-bd.mjs";

const db = await abrir();

const contar = async (t) => Number((await db.consulta(`SELECT COUNT(*) AS n FROM ${t}`))[0].n);
const antes = [];
for (const t of TABELAS) antes.push([t, await contar(t)]);
const total = antes.reduce((s, [, n]) => s + n, 0);

console.log(`Base de dados: ${db.etiqueta}\n`);
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

for (const t of TABELAS) await db.executa(`DELETE FROM ${t}`);

// Reinicia os contadores de id, para o próximo registo ser o número 1.
if (usaPostgres) {
  for (const t of TABELAS) await db.exec(`ALTER SEQUENCE ${t}_id_seq RESTART WITH 1`);
} else {
  await db.executa("DELETE FROM sqlite_sequence");
  await db.exec("VACUUM");
}
await db.fechar();

console.log("Apagado. O CRM está vazio e os ids começam de novo em 1.");
