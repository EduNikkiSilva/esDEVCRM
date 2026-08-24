/**
 * Popula a base de dados local com os dois exemplos do documento operacional
 * (§26 PME de remodelações, §27 imobiliária) mais uma lead em fase inicial.
 *
 *   node scripts/dados-exemplo.mjs           # insere se estiver vazia
 *   node scripts/dados-exemplo.mjs --forcar  # apaga tudo e volta a inserir
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const raiz = process.cwd();
const caminho = process.env.ESDEV_DB ?? path.join(raiz, "data", "esdev.db");
fs.mkdirSync(path.dirname(caminho), { recursive: true });

const db = new Database(caminho);
db.pragma("foreign_keys = ON");
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
   VALUES (@empresa, @contacto, @email, @telefone, @origem, @fase, @tipo, @orcamento, @valor, @notas)`,
);

const inserirCliente = db.prepare(
  `INSERT INTO clientes (empresa, nif, contacto_nome, contacto_cargo, email, telefone, website)
   VALUES (@empresa, @nif, @contacto, @cargo, @email, @telefone, @website)`,
);

const inserirProjeto = db.prepare(
  `INSERT INTO projetos (cliente_id, lead_id, nome, pacote, estado, preco, custos_externos,
                         horas_estimadas, horas_reais, inicio, entrega_prevista, checklist, notas)
   VALUES (@cliente, @lead, @nome, @pacote, @estado, @preco, @custos, @horasEst, @horasReais,
           @inicio, @entrega, @checklist, @notas)`,
);

const inserirFatura = db.prepare(
  `INSERT INTO faturas (projeto_id, cliente_id, descricao, tipo, valor, estado, emitida_em, paga_em)
   VALUES (@projeto, @cliente, @descricao, @tipo, @valor, @estado, @emitida, @paga)`,
);

const inserirManutencao = db.prepare(
  `INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio, notas)
   VALUES (@cliente, @projeto, @plano, @valor, 'Ativo', @inicio, @notas)`,
);

const inserirAnalise = db.prepare(
  `INSERT INTO analises (lead_id, titulo, inputs, preco_minimo, preco_recomendado, preco_premium,
                         mensalidade, plano_manutencao, horas_estimadas, valor_hora)
   VALUES (@lead, @titulo, @inputs, @min, @rec, @prem, @mensalidade, @plano, @horas, @valorHora)`,
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

db.transaction(() => {
  // §26 — PME de remodelações, classificada como Website Business.
  const leadRemodelacoes = inserirLead.run({
    empresa: "Remodelações Silva & Filhos",
    contacto: "António Silva",
    email: "geral@remodelacoessilva.pt",
    telefone: "912 000 111",
    origem: "Recomendação",
    fase: "Projeto ativo",
    tipo: "Website institucional",
    orcamento: "1.000–2.000 €",
    valor: 1400,
    notas:
      "Homepage, empresa, serviços, projetos, contactos, formulário, WhatsApp, Google Maps, galeria, SEO técnico e mobile.",
  }).lastInsertRowid;

  const clienteRemodelacoes = inserirCliente.run({
    empresa: "Remodelações Silva & Filhos, Lda.",
    nif: "500000000",
    contacto: "António Silva",
    cargo: "Sócio-gerente",
    email: "geral@remodelacoessilva.pt",
    telefone: "912 000 111",
    website: "—",
  }).lastInsertRowid;

  db.prepare("UPDATE leads SET cliente_id=? WHERE id=?").run(clienteRemodelacoes, leadRemodelacoes);

  inserirAnalise.run({
    lead: leadRemodelacoes,
    titulo: "Website Business",
    inputs: JSON.stringify({
      pacoteId: "web-business",
      extras: { "pagina-simples": 1, "seo-local": 1 },
      complexidade: complexidade(3),
      urgencia: 1,
      risco: 2,
      prioritario: false,
      horasEstimadas: 42,
      custosExternos: 0,
      ajusteComercial: 0,
    }),
    min: 1180,
    rec: 1630,
    prem: 2080,
    mensalidade: 49,
    plano: "business",
    horas: 42,
    valorHora: 38.8,
  });

  const projetoRemodelacoes = inserirProjeto.run({
    cliente: clienteRemodelacoes,
    lead: leadRemodelacoes,
    nome: "Website Remodelações Silva",
    pacote: "Website Business",
    estado: "Desenvolvimento",
    preco: 1400,
    custos: 0,
    horasEst: 42,
    horasReais: 26,
    inicio: "2026-08-04",
    entrega: "2026-09-15",
    checklist: JSON.stringify(["Formulários testados", "Mobile e desktop testados"]),
    notas: "Cliente fornece textos e fotografias das obras.",
  }).lastInsertRowid;

  inserirFatura.run({
    projeto: projetoRemodelacoes,
    cliente: clienteRemodelacoes,
    descricao: "Adjudicação (50%)",
    tipo: "Adjudicação",
    valor: 700,
    estado: "Paga",
    emitida: "2026-08-04",
    paga: "2026-08-06",
  });
  inserirFatura.run({
    projeto: projetoRemodelacoes,
    cliente: clienteRemodelacoes,
    descricao: "Antes da entrega (50%)",
    tipo: "Entrega final",
    valor: 700,
    estado: "Pendente",
    emitida: null,
    paga: null,
  });

  inserirManutencao.run({
    cliente: clienteRemodelacoes,
    projeto: projetoRemodelacoes,
    plano: "business",
    valor: 49,
    inicio: "2026-09-15",
    notas: "Inclui alojamento e uma hora mensal de alterações.",
  });

  inserirTarefa.run(projetoRemodelacoes, "Aprovar design da homepage", "Concluída", "2026-08-12");
  inserirTarefa.run(projetoRemodelacoes, "Integrar galeria de projetos", "Aberta", "2026-08-28");
  inserirTarefa.run(projetoRemodelacoes, "Configurar Search Console", "Aberta", "2026-09-10");

  // §27 — imobiliária, Website Pro com extras.
  const leadImobiliaria = inserirLead.run({
    empresa: "Imobiliária Costa Verde",
    contacto: "Marta Costa",
    email: "marta@costaverde.pt",
    telefone: "934 555 222",
    origem: "Website esDEV",
    fase: "Proposta enviada",
    tipo: "Website institucional",
    orcamento: "2.000–5.000 €",
    valor: 3290,
    notas:
      "10 páginas, catálogo de imóveis, pesquisa, filtros, formulário, WhatsApp, multilingue, CMS, SEO local e integração externa.",
  }).lastInsertRowid;

  const analiseImobiliaria = inserirAnalise.run({
    lead: leadImobiliaria,
    titulo: "Website Pro + sistema de imóveis",
    inputs: JSON.stringify({
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
      horasEstimadas: 90,
      custosExternos: 0,
      ajusteComercial: 0,
    }),
    min: 3010,
    rec: 3830,
    prem: 5000,
    mensalidade: 89,
    plano: "pro",
    horas: 90,
    valorHora: 42.5,
  }).lastInsertRowid;

  db.prepare(
    `INSERT INTO propostas (lead_id, analise_id, nivel, valor, mensalidade, validade_dias, estado,
                            ambito, exclusoes, rondas_alteracoes)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    leadImobiliaria,
    analiseImobiliaria,
    "BUSINESS",
    3290,
    89,
    30,
    "Enviada",
    "10 páginas, catálogo de imóveis com backoffice, pesquisa e filtros, multilingue PT/EN, CMS, SEO local e integração com portal externo.",
    "Fotografia dos imóveis, tradução dos conteúdos, licenças de terceiros e alojamento do primeiro ano.",
    2,
  );

  // Lead em fase inicial, sem briefing.
  inserirLead.run({
    empresa: "Clínica Dentária Nova",
    contacto: "Dra. Rita Nunes",
    email: "geral@clinicanova.pt",
    telefone: "222 333 444",
    origem: "Redes sociais",
    fase: "Reunião marcada",
    tipo: "Landing page / One-page",
    orcamento: "500–1.000 €",
    valor: 700,
    notas: "Quer captar marcações. Reunião de discovery agendada.",
  });
})();

console.log(`Dados de exemplo inseridos em ${caminho}`);
