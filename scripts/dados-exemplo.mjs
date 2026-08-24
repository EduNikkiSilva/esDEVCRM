/**
 * Popula a base de dados local com os dois exemplos do documento operacional
 * (§26 PME de remodelações, §27 imobiliária) mais uma lead em fase inicial.
 *
 *   node scripts/dados-exemplo.mjs           # insere se estiver vazia
 *   node scripts/dados-exemplo.mjs --forcar  # apaga tudo e volta a inserir
 */
import { TABELAS, abrir } from "./lib-bd.mjs";

const db = await abrir();

const forcar = process.argv.includes("--forcar");
const existentes = Number((await db.consulta("SELECT COUNT(*) AS n FROM leads"))[0].n);

if (existentes > 0 && !forcar) {
  console.log(
    `A base de dados já tem ${existentes} lead(s). Use --forcar para apagar e recriar os exemplos.`,
  );
  process.exit(0);
}

if (forcar) {
  for (const t of TABELAS) await db.executa(`DELETE FROM ${t}`);
}

const SQL_INSERIR_LEAD = `INSERT INTO leads (empresa, contacto_nome, email, telefone, origem, fase, tipo_solucao,
                      orcamento_indicado, valor_estimado, notas)
   VALUES (?,?,?,?,?,?,?,?,?,?)`;

const SQL_INSERIR_CLIENTE = `INSERT INTO clientes (empresa, nif, contacto_nome, contacto_cargo, email, telefone, website)
   VALUES (?,?,?,?,?,?,?)`;

const SQL_INSERIR_PROJETO = `INSERT INTO projetos (cliente_id, lead_id, nome, pacote, estado, preco, custos_externos,
                         horas_estimadas, horas_reais, inicio, entrega_prevista, checklist, notas)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

const SQL_INSERIR_FATURA = `INSERT INTO faturas (projeto_id, cliente_id, descricao, tipo, valor, estado, emitida_em, paga_em)
   VALUES (?,?,?,?,?,?,?,?)`;

const SQL_INSERIR_MANUTENCAO = `INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio, notas)
   VALUES (?,?,?,?,'Ativo',?,?)`;

const SQL_INSERIR_ANALISE = `INSERT INTO analises (lead_id, titulo, inputs, preco_minimo, preco_recomendado, preco_premium,
                         mensalidade, plano_manutencao, horas_estimadas, valor_hora)
   VALUES (?,?,?,?,?,?,?,?,?,?)`;

const SQL_INSERIR_PROPOSTA = `INSERT INTO propostas (lead_id, analise_id, nivel, valor, mensalidade, validade_dias, estado,
                          ambito, exclusoes, rondas_alteracoes)
   VALUES (?,?,?,?,?,?,?,?,?,?)`;

const SQL_INSERIR_TAREFA = "INSERT INTO tarefas (projeto_id, titulo, estado, prazo) VALUES (?,?,?,?)";

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
  (await db.executa(
    SQL_INSERIR_LEAD,
    "Remodelações Silva & Filhos",
    "António Silva",
    "geral@remodelacoessilva.pt",
    "912 000 111",
    "Recomendação",
    "Projeto ativo",
    "Website institucional",
    "1.000–2.000 €",
    2520,
    "Homepage, empresa, serviços, projetos, contactos, formulário, WhatsApp, Google Maps, galeria, SEO técnico e mobile.",
  )).lastInsertRowid,
);

const clienteRemodelacoes = Number(
  (await db.executa(
    SQL_INSERIR_CLIENTE,
    "Remodelações Silva & Filhos, Lda.",
    "500000000",
    "António Silva",
    "Sócio-gerente",
    "geral@remodelacoessilva.pt",
    "912 000 111",
    "—",
  )).lastInsertRowid,
);

await db.executa("UPDATE leads SET cliente_id=? WHERE id=?", clienteRemodelacoes, leadRemodelacoes);

await db.executa(SQL_INSERIR_ANALISE, 
  leadRemodelacoes,
  "Website Business",
  JSON.stringify({
    pacoteId: "web-business",
    extras: { "pagina-simples": 1, "seo-local": 1 },
    complexidade: complexidade(3),
    urgencia: 1,
    risco: 2,
    prioritario: false,
    horasEstimadas: 45,
    custosExternos: 0,
    ajusteComercial: 0,
  }),
  1830,
  2520,
  3340,
  120,
  "business",
  45,
  56,
);

const projetoRemodelacoes = Number(
  (await db.executa(
    SQL_INSERIR_PROJETO,
    clienteRemodelacoes,
    leadRemodelacoes,
    "Website Remodelações Silva",
    "Website Business",
    "Desenvolvimento",
    2520,
    0,
    45,
    38,
    "2026-08-04",
    "2026-09-15",
    JSON.stringify(["Formulários testados", "Mobile e desktop testados"]),
    "Cliente fornece textos e fotografias das obras.",
  )).lastInsertRowid,
);

await db.executa(SQL_INSERIR_FATURA, 
  projetoRemodelacoes,
  clienteRemodelacoes,
  "Adjudicação (50%)",
  "Adjudicação",
  1260,
  "Paga",
  "2026-08-04",
  "2026-08-06",
);
await db.executa(SQL_INSERIR_FATURA, 
  projetoRemodelacoes,
  clienteRemodelacoes,
  "Antes da entrega (50%)",
  "Entrega final",
  1260,
  "Pendente",
  null,
  null,
);

await db.executa(SQL_INSERIR_MANUTENCAO, 
  clienteRemodelacoes,
  projetoRemodelacoes,
  "business",
  120,
  "2026-09-15",
  "Inclui alojamento e 1,5h mensais de alterações.",
);

await db.executa(SQL_INSERIR_TAREFA, projetoRemodelacoes, "Aprovar design da homepage", "Concluída", "2026-08-12");
await db.executa(SQL_INSERIR_TAREFA, projetoRemodelacoes, "Integrar galeria de projetos", "Aberta", "2026-08-28");
await db.executa(SQL_INSERIR_TAREFA, projetoRemodelacoes, "Configurar Search Console", "Aberta", "2026-09-10");

// §27 — imobiliária, Website Pro com extras.
const leadImobiliaria = Number(
  (await db.executa(
    SQL_INSERIR_LEAD,
    "Imobiliária Costa Verde",
    "Marta Costa",
    "marta@costaverde.pt",
    "934 555 222",
    "Website esDEV",
    "Proposta enviada",
    "Website institucional",
    "5.000 €+",
    7400,
    "10 páginas, catálogo de imóveis, pesquisa, filtros, formulário, WhatsApp, multilingue, CMS, SEO local e integração externa.",
  )).lastInsertRowid,
);

const analiseImobiliaria = Number(
  (await db.executa(
    SQL_INSERIR_ANALISE,
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
      horasEstimadas: 110,
      custosExternos: 0,
      ajusteComercial: 0,
    }),
    5300,
    7590,
    10720,
    150,
    "business",
    110,
    69,
  )).lastInsertRowid,
);

await db.executa(SQL_INSERIR_PROPOSTA, 
  leadImobiliaria,
  analiseImobiliaria,
  "BUSINESS",
  7400,
  150,
  30,
  "Enviada",
  "10 páginas, catálogo de imóveis com backoffice, pesquisa e filtros, multilingue PT/EN, CMS, SEO local e integração com portal externo.",
  "Fotografia dos imóveis, tradução dos conteúdos, licenças de terceiros e alojamento do primeiro ano.",
  2,
);

// Lead em fase inicial, sem briefing.
await db.executa(SQL_INSERIR_LEAD, 
  "Clínica Dentária Nova",
  "Dra. Rita Nunes",
  "geral@clinicanova.pt",
  "222 333 444",
  "Redes sociais",
  "Reunião marcada",
  "Landing page / One-page",
  "500–1.000 €",
  750,
  "Quer captar marcações. Reunião de discovery agendada.",
);

console.log(`Dados de exemplo inseridos em ${db.etiqueta}`);
await db.fechar();
