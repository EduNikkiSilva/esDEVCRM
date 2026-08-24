/**
 * Popula a base de dados local com os dois exemplos do documento operacional
 * (§26 PME de remodelações, §27 imobiliária) mais uma lead em fase inicial.
 *
 *   node scripts/dados-exemplo.mjs           # insere se estiver vazia
 *   node scripts/dados-exemplo.mjs --forcar  # apaga tudo e volta a inserir
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const raiz = process.cwd();
const caminho = process.env.ESDEV_DB ?? path.join(raiz, "data", "esdev.db");
fs.mkdirSync(path.dirname(caminho), { recursive: true });

const db = new DatabaseSync(caminho);
db.exec("PRAGMA foreign_keys = ON");
db.exec(fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8"));

const forcar = process.argv.includes("--forcar");
const existentes = db.prepare("SELECT COUNT(*) AS n FROM leads").get().n;

if (existentes > 0 && !forcar) {
  console.log(
    `A base de dados já tem ${existentes} lead(s). Use --forcar para apagar e recriar os exemplos.`,
  );
  process.exit(0);
}

if (forcar) {
  for (const t of [
    "tarefas",
    "faturas",
    "manutencoes",
    "propostas",
    "analises",
    "briefings",
    "projetos",
    "leads",
    "clientes",
  ]) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
}

const inserirLead = db.prepare(
  `INSERT INTO leads (empresa, contacto_nome, email, telefone, origem, fase, tipo_solucao,
                      orcamento_indicado, valor_estimado, notas)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,
);

const inserirCliente = db.prepare(
  `INSERT INTO clientes (empresa, nif, contacto_nome, contacto_cargo, email, telefone, website)
   VALUES (?,?,?,?,?,?,?)`,
);

const inserirProjeto = db.prepare(
  `INSERT INTO projetos (cliente_id, lead_id, nome, pacote, estado, preco, custos_externos,
                         horas_estimadas, horas_reais, inicio, entrega_prevista, checklist, notas)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
);

const inserirFatura = db.prepare(
  `INSERT INTO faturas (projeto_id, cliente_id, descricao, tipo, valor, estado, emitida_em, paga_em)
   VALUES (?,?,?,?,?,?,?,?)`,
);

const inserirManutencao = db.prepare(
  `INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio, notas)
   VALUES (?,?,?,?,'Ativo',?,?)`,
);

const inserirAnalise = db.prepare(
  `INSERT INTO analises (lead_id, titulo, inputs, preco_minimo, preco_recomendado, preco_premium,
                         mensalidade, plano_manutencao, horas_estimadas, valor_hora)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,
);

const inserirProposta = db.prepare(
  `INSERT INTO propostas (lead_id, analise_id, nivel, valor, mensalidade, validade_dias, estado,
                          ambito, exclusoes, rondas_alteracoes)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,
);

const inserirTarefa = db.prepare(
  "INSERT INTO tarefas (projeto_id, titulo, estado, prazo) VALUES (?,?,?,?)",
);

const complexidade = (v) => ({
  geral: v,
  design: v,
  desenvolvimento: v,
  conteudo: v,
  integracoes: v,
  dados: v,
  seo: v,
});

// §26 — PME de remodelações, classificada como Website Business.
const leadRemodelacoes = Number(
  inserirLead.run(
    "Remodelações Silva & Filhos",
    "António Silva",
    "geral@remodelacoessilva.pt",
    "912 000 111",
    "Recomendação",
    "Projeto ativo",
    "Website institucional",
    "2.000–5.000 €",
    3360,
    "Homepage, empresa, serviços, projetos, contactos, formulário, WhatsApp, Google Maps, galeria, SEO técnico e mobile.",
  ).lastInsertRowid,
);

const clienteRemodelacoes = Number(
  inserirCliente.run(
    "Remodelações Silva & Filhos, Lda.",
    "500000000",
    "António Silva",
    "Sócio-gerente",
    "geral@remodelacoessilva.pt",
    "912 000 111",
    "—",
  ).lastInsertRowid,
);

db.prepare("UPDATE leads SET cliente_id=? WHERE id=?").run(clienteRemodelacoes, leadRemodelacoes);

inserirAnalise.run(
  leadRemodelacoes,
  "Website Business",
  JSON.stringify({
    pacoteId: "web-business",
    extras: { "pagina-simples": 1, "seo-local": 1 },
    complexidade: complexidade(3),
    urgencia: 1,
    risco: 2,
    prioritario: false,
    horasEstimadas: 56,
    custosExternos: 0,
    ajusteComercial: 0,
  }),
  2440,
  3360,
  4410,
  160,
  "business",
  56,
  60,
);

const projetoRemodelacoes = Number(
  inserirProjeto.run(
    clienteRemodelacoes,
    leadRemodelacoes,
    "Website Remodelações Silva",
    "Website Business",
    "Desenvolvimento",
    3360,
    0,
    56,
    38,
    "2026-08-04",
    "2026-09-15",
    JSON.stringify(["Formulários testados", "Mobile e desktop testados"]),
    "Cliente fornece textos e fotografias das obras.",
  ).lastInsertRowid,
);

inserirFatura.run(
  projetoRemodelacoes,
  clienteRemodelacoes,
  "Adjudicação (50%)",
  "Adjudicação",
  1680,
  "Paga",
  "2026-08-04",
  "2026-08-06",
);
inserirFatura.run(
  projetoRemodelacoes,
  clienteRemodelacoes,
  "Antes da entrega (50%)",
  "Entrega final",
  1680,
  "Pendente",
  null,
  null,
);

inserirManutencao.run(
  clienteRemodelacoes,
  projetoRemodelacoes,
  "business",
  160,
  "2026-09-15",
  "Inclui alojamento e duas horas mensais de alterações.",
);

inserirTarefa.run(projetoRemodelacoes, "Aprovar design da homepage", "Concluída", "2026-08-12");
inserirTarefa.run(projetoRemodelacoes, "Integrar galeria de projetos", "Aberta", "2026-08-28");
inserirTarefa.run(projetoRemodelacoes, "Configurar Search Console", "Aberta", "2026-09-10");

// §27 — imobiliária, Website Pro com extras.
const leadImobiliaria = Number(
  inserirLead.run(
    "Imobiliária Costa Verde",
    "Marta Costa",
    "marta@costaverde.pt",
    "934 555 222",
    "Website esDEV",
    "Proposta enviada",
    "Website institucional",
    "5.000 €+",
    9800,
    "10 páginas, catálogo de imóveis, pesquisa, filtros, formulário, WhatsApp, multilingue, CMS, SEO local e integração externa.",
  ).lastInsertRowid,
);

const analiseImobiliaria = Number(
  inserirAnalise.run(
    leadImobiliaria,
    "Website Pro + sistema de imóveis",
    JSON.stringify({
      pacoteId: "web-pro",
      extras: {
        "pagina-sistema": 1,
        filtros: 1,
        multilingue: 1,
        "integracao-api": 1,
        "seo-local": 1,
        "blog-cms": 1,
      },
      complexidade: { ...complexidade(3), desenvolvimento: 4, integracoes: 4, dados: 4 },
      urgencia: 2,
      risco: 3,
      prioritario: false,
      horasEstimadas: 150,
      custosExternos: 0,
      ajusteComercial: 0,
    }),
    6990,
    10060,
    14270,
    540,
    "pro",
    150,
    67.1,
  ).lastInsertRowid,
);

inserirProposta.run(
  leadImobiliaria,
  analiseImobiliaria,
  "BUSINESS",
  9800,
  540,
  30,
  "Enviada",
  "10 páginas, catálogo de imóveis com backoffice, pesquisa e filtros, multilingue PT/EN, CMS, SEO local e integração com portal externo.",
  "Fotografia dos imóveis, tradução dos conteúdos, licenças de terceiros e alojamento do primeiro ano.",
  2,
);

// Lead em fase inicial, sem briefing.
inserirLead.run(
  "Clínica Dentária Nova",
  "Dra. Rita Nunes",
  "geral@clinicanova.pt",
  "222 333 444",
  "Redes sociais",
  "Reunião marcada",
  "Landing page / One-page",
  "500–1.000 €",
  950,
  "Quer captar marcações. Reunião de discovery agendada.",
);

console.log(`Dados de exemplo inseridos em ${caminho}`);
