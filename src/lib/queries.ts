import { hoje, mensalizar, somarDias } from "@/lib/datas";
import { consulta, mesDe, primeiro, semAcento } from "@/lib/db";
import { ESTADOS_PROPOSTA_ABERTOS, FASES_ABERTAS } from "@/lib/dominio";

export type Cliente = {
  id: number;
  empresa: string;
  nif: string | null;
  contacto_nome: string | null;
  contacto_cargo: string | null;
  email: string | null;
  telefone: string | null;
  website: string | null;
  notas: string | null;
  criado_em: string;
};

export type Lead = {
  id: number;
  cliente_id: number | null;
  empresa: string;
  contacto_nome: string | null;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  fase: string;
  tipo_solucao: string | null;
  orcamento_indicado: string | null;
  valor_estimado: number;
  responsavel: string | null;
  motivo_perda: string | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Analise = {
  id: number;
  lead_id: number | null;
  titulo: string | null;
  inputs: string;
  preco_minimo: number;
  preco_recomendado: number;
  preco_premium: number;
  mensalidade: number;
  plano_manutencao: string | null;
  horas_estimadas: number | null;
  valor_hora: number | null;
  criado_em: string;
};

export type Proposta = {
  id: number;
  lead_id: number;
  analise_id: number | null;
  numero: string | null;
  nivel: string;
  valor: number;
  mensalidade: number;
  validade_dias: number;
  estado: string;
  ambito: string | null;
  exclusoes: string | null;
  condicoes: string | null;
  observacoes: string | null;
  rondas_alteracoes: number;
  enviada_em: string | null;
  respondida_em: string | null;
  expira_em: string | null;
  criado_em: string;
};

export type Projeto = {
  id: number;
  cliente_id: number | null;
  lead_id: number | null;
  nome: string;
  pacote: string | null;
  estado: string;
  preco: number;
  custos_externos: number;
  horas_estimadas: number;
  horas_reais: number;
  inicio: string | null;
  entrega_prevista: string | null;
  checklist: string;
  notas: string | null;
  criado_em: string;
};

export type Fatura = {
  id: number;
  projeto_id: number | null;
  cliente_id: number | null;
  descricao: string;
  tipo: string;
  valor: number;
  estado: string;
  emitida_em: string | null;
  vence_em: string | null;
  paga_em: string | null;
};

export type Manutencao = {
  id: number;
  cliente_id: number | null;
  projeto_id: number | null;
  plano: string;
  valor_mensal: number;
  estado: string;
  inicio: string | null;
  ciclo: string;
  renovacao: string | null;
  fim: string | null;
  notas: string | null;
};

export type Atividade = {
  id: number;
  lead_id: number | null;
  cliente_id: number | null;
  projeto_id: number | null;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data: string;
  hora: string | null;
  concluida: number;
  concluida_em: string | null;
  criado_em: string;
};

export type Contacto = {
  id: number;
  cliente_id: number;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  principal: number;
  notas: string | null;
};

export type Contrato = {
  id: number;
  cliente_id: number | null;
  proposta_id: number | null;
  projeto_id: number | null;
  titulo: string;
  estado: string;
  data: string | null;
  ficheiro: string | null;
  notas: string | null;
};

export type ServicoRecorrente = {
  id: number;
  cliente_id: number;
  projeto_id: number | null;
  tipo: string;
  descricao: string | null;
  fornecedor: string | null;
  custo: number;
  preco: number;
  periodicidade: string;
  inicio: string | null;
  renovacao: string | null;
  estado: string;
  notas: string | null;
};

export const listarClientes = () =>
  consulta<Cliente>(`SELECT * FROM clientes ORDER BY ${semAcento("empresa")}`);

/**
 * Lista de clientes com os números que interessam ver de relance. As somas são
 * feitas em subconsultas para não multiplicar linhas com vários JOIN.
 */
export const listarClientesComResumo = (dia = hoje()) =>
  consulta<
    Cliente & {
      faturado: number;
      pendente: number;
      vencido: number;
      projetos: number;
      recorrente: number;
      ultima_atividade: string | null;
      proxima_atividade: string | null;
    }
  >(
    `SELECT c.*,
       (SELECT COALESCE(SUM(valor),0) FROM faturas f WHERE f.cliente_id = c.id AND f.estado <> 'Anulada') AS faturado,
       (SELECT COALESCE(SUM(valor),0) FROM faturas f WHERE f.cliente_id = c.id AND f.estado = 'Pendente') AS pendente,
       (SELECT COALESCE(SUM(valor),0) FROM faturas f WHERE f.cliente_id = c.id AND f.estado = 'Pendente'
          AND f.vence_em IS NOT NULL AND f.vence_em < ?) AS vencido,
       (SELECT COUNT(*) FROM projetos p WHERE p.cliente_id = c.id) AS projetos,
       (SELECT COALESCE(SUM(valor_mensal),0) FROM manutencoes m WHERE m.cliente_id = c.id AND m.estado = 'Ativo') AS recorrente,
       (SELECT MAX(data) FROM atividades a WHERE a.cliente_id = c.id AND a.concluida = 1) AS ultima_atividade,
       (SELECT MIN(data) FROM atividades a WHERE a.cliente_id = c.id AND a.concluida = 0) AS proxima_atividade
     FROM clientes c
     ORDER BY ${semAcento("c.empresa")}`,
    dia,
  );

export const obterCliente = (id: number) =>
  primeiro<Cliente>("SELECT * FROM clientes WHERE id = ?", id);

export const listarLeads = () =>
  consulta<Lead>("SELECT * FROM leads ORDER BY atualizado_em DESC");

export const obterLead = (id: number) => primeiro<Lead>("SELECT * FROM leads WHERE id = ?", id);

export const obterBriefing = (leadId: number) =>
  primeiro<{ dados: string; atualizado_em: string }>(
    "SELECT dados, atualizado_em FROM briefings WHERE lead_id = ?",
    leadId,
  );

export const listarAnalises = (leadId: number) =>
  consulta<Analise>("SELECT * FROM analises WHERE lead_id = ? ORDER BY id DESC", leadId);

export const obterAnalise = (id: number) =>
  primeiro<Analise>("SELECT * FROM analises WHERE id = ?", id);

export const listarPropostas = (leadId: number) =>
  consulta<Proposta>("SELECT * FROM propostas WHERE lead_id = ? ORDER BY id DESC", leadId);

export const listarTodasPropostas = () =>
  consulta<Proposta & { empresa: string }>(
    `SELECT p.*, l.empresa FROM propostas p
     JOIN leads l ON l.id = p.lead_id
     ORDER BY p.id DESC`,
  );

export const listarProjetos = () =>
  consulta<Projeto & { cliente: string | null }>(
    `SELECT p.*, c.empresa AS cliente FROM projetos p
     LEFT JOIN clientes c ON c.id = p.cliente_id
     ORDER BY p.id DESC`,
  );

export const obterProjeto = (id: number) =>
  primeiro<Projeto & { cliente: string | null }>(
    `SELECT p.*, c.empresa AS cliente FROM projetos p
     LEFT JOIN clientes c ON c.id = p.cliente_id WHERE p.id = ?`,
    id,
  );

export const listarFaturas = (projetoId?: number) =>
  projetoId
    ? consulta<Fatura>("SELECT * FROM faturas WHERE projeto_id = ? ORDER BY id", projetoId)
    : consulta<Fatura & { cliente: string | null; projeto: string | null }>(
        `SELECT f.*, c.empresa AS cliente, p.nome AS projeto FROM faturas f
         LEFT JOIN clientes c ON c.id = f.cliente_id
         LEFT JOIN projetos p ON p.id = f.projeto_id
         ORDER BY f.estado = 'Paga', COALESCE(f.emitida_em, f.criado_em) DESC`,
      );

export const projetosDoCliente = (clienteId: number) =>
  consulta<Projeto>("SELECT * FROM projetos WHERE cliente_id = ? ORDER BY id DESC", clienteId);

export const faturasDoCliente = (clienteId: number) =>
  consulta<Fatura>(
    "SELECT * FROM faturas WHERE cliente_id = ? ORDER BY estado = 'Paga', id DESC",
    clienteId,
  );

/** Propostas de todas as leads deste cliente. */
export const propostasDoCliente = (clienteId: number) =>
  consulta<Proposta & { empresa: string }>(
    `SELECT p.*, l.empresa FROM propostas p
     JOIN leads l ON l.id = p.lead_id
     WHERE l.cliente_id = ? ORDER BY p.id DESC`,
    clienteId,
  );

export const manutencoesDoCliente = (clienteId: number) =>
  consulta<Manutencao>("SELECT * FROM manutencoes WHERE cliente_id = ? ORDER BY id DESC", clienteId);

export const listarManutencoes = () =>
  consulta<Manutencao & { cliente: string | null; projeto: string | null }>(
    `SELECT m.*, c.empresa AS cliente, p.nome AS projeto FROM manutencoes m
     LEFT JOIN clientes c ON c.id = m.cliente_id
     LEFT JOIN projetos p ON p.id = m.projeto_id
     ORDER BY m.estado, m.valor_mensal DESC`,
  );

// --- Atividades e timeline ---------------------------------------------------

export type AlvoAtividade = { leadId?: number; clienteId?: number; projetoId?: number };

/**
 * Timeline de um alvo. As atividades pendentes vêm primeiro, por data ascendente
 * (é a próxima ação), e o histórico depois, por data descendente.
 */
export async function listarAtividades(alvo: AlvoAtividade) {
  const onde: string[] = [];
  const params: number[] = [];
  for (const [coluna, valor] of [
    ["lead_id", alvo.leadId],
    ["cliente_id", alvo.clienteId],
    ["projeto_id", alvo.projetoId],
  ] as const) {
    if (!valor) continue;
    onde.push(`${coluna} = ?`);
    params.push(valor);
  }
  if (!onde.length) return [];
  return consulta<Atividade>(
    `SELECT * FROM atividades WHERE ${onde.join(" OR ")}
     ORDER BY concluida, CASE WHEN concluida = 0 THEN data END,
              data DESC, COALESCE(hora, '') DESC, id DESC`,
    ...params,
  );
}

/** Atividades com data no dia indicado e ainda não concluídas. */
export const atividadesDoDia = (dia = hoje()) =>
  consulta<Atividade & { empresa: string | null; cliente: string | null }>(
    `SELECT a.*, l.empresa, c.empresa AS cliente FROM atividades a
     LEFT JOIN leads l ON l.id = a.lead_id
     LEFT JOIN clientes c ON c.id = a.cliente_id
     WHERE a.concluida = 0 AND a.data = ?
     ORDER BY COALESCE(a.hora, '99:99'), a.id`,
    dia,
  );

/** Atividades pendentes cuja data já passou — o que ficou para trás. */
export const atividadesAtrasadas = (dia = hoje()) =>
  consulta<Atividade & { empresa: string | null; cliente: string | null }>(
    `SELECT a.*, l.empresa, c.empresa AS cliente FROM atividades a
     LEFT JOIN leads l ON l.id = a.lead_id
     LEFT JOIN clientes c ON c.id = a.cliente_id
     WHERE a.concluida = 0 AND a.data < ?
     ORDER BY a.data, a.id`,
    dia,
  );

/** Próxima ação pendente de cada lead, indexada por lead. */
export async function proximasAcoesPorLead() {
  const linhas = await consulta<{ lead_id: number; id: number; tipo: string; titulo: string; data: string }>(
    `SELECT lead_id, id, tipo, titulo, data FROM atividades
     WHERE lead_id IS NOT NULL AND concluida = 0
     ORDER BY data DESC, id DESC`,
  );
  // A ordem descendente faz com que a última escrita no Map seja a data mais
  // próxima, sem precisar de window functions (que o SQLite antigo não tem).
  return new Map(linhas.map((l) => [l.lead_id, l]));
}

/** Data do último contacto registado de cada lead. */
export async function ultimosContactosPorLead() {
  const linhas = await consulta<{ lead_id: number; data: string }>(
    `SELECT lead_id, MAX(data) AS data FROM atividades
     WHERE lead_id IS NOT NULL AND concluida = 1
     GROUP BY lead_id`,
  );
  return new Map(linhas.map((l) => [l.lead_id, l.data]));
}

// --- Contactos ---------------------------------------------------------------

export const listarContactos = (clienteId: number) =>
  consulta<Contacto>(
    `SELECT * FROM contactos WHERE cliente_id = ? ORDER BY principal DESC, ${semAcento("nome")}`,
    clienteId,
  );

// --- Contratos ---------------------------------------------------------------

export const contratosDoCliente = (clienteId: number) =>
  consulta<Contrato>("SELECT * FROM contratos WHERE cliente_id = ? ORDER BY id DESC", clienteId);

// --- Serviços recorrentes ----------------------------------------------------

export const listarServicosRecorrentes = () =>
  consulta<ServicoRecorrente & { cliente: string | null; projeto: string | null }>(
    `SELECT s.*, c.empresa AS cliente, p.nome AS projeto FROM servicos_recorrentes s
     LEFT JOIN clientes c ON c.id = s.cliente_id
     LEFT JOIN projetos p ON p.id = s.projeto_id
     ORDER BY s.estado, COALESCE(s.renovacao, '9999'), s.id DESC`,
  );

export const servicosDoCliente = (clienteId: number) =>
  consulta<ServicoRecorrente>(
    "SELECT * FROM servicos_recorrentes WHERE cliente_id = ? ORDER BY estado, id DESC",
    clienteId,
  );

// --- Financeiro --------------------------------------------------------------

/** Faturas pendentes cuja data de vencimento já passou. */
export const faturasVencidas = (dia = hoje()) =>
  consulta<Fatura & { cliente: string | null; projeto: string | null }>(
    `SELECT f.*, c.empresa AS cliente, p.nome AS projeto FROM faturas f
     LEFT JOIN clientes c ON c.id = f.cliente_id
     LEFT JOIN projetos p ON p.id = f.projeto_id
     WHERE f.estado = 'Pendente' AND f.vence_em IS NOT NULL AND f.vence_em < ?
     ORDER BY f.vence_em`,
    dia,
  );

/** Propostas que ainda podem ser ganhas. */
export const propostasAbertas = () =>
  consulta<Proposta & { empresa: string }>(
    `SELECT p.*, l.empresa FROM propostas p
     JOIN leads l ON l.id = p.lead_id
     WHERE p.estado IN (${ESTADOS_PROPOSTA_ABERTOS.map(() => "?").join(",")})
     ORDER BY COALESCE(p.expira_em, '9999'), p.id DESC`,
    ...ESTADOS_PROPOSTA_ABERTOS,
  );

/** Manutenções e serviços recorrentes a renovar dentro de `dias`. */
export async function renovacoesProximas(dias = 45) {
  const inicio = hoje();
  const fim = somarDias(inicio, dias);

  const manutencoes = await consulta<Manutencao & { cliente: string | null }>(
    `SELECT m.*, c.empresa AS cliente FROM manutencoes m
     LEFT JOIN clientes c ON c.id = m.cliente_id
     WHERE m.estado = 'Ativo' AND m.renovacao IS NOT NULL AND m.renovacao <= ?
     ORDER BY m.renovacao`,
    fim,
  );
  const servicos = await consulta<ServicoRecorrente & { cliente: string | null }>(
    `SELECT s.*, c.empresa AS cliente FROM servicos_recorrentes s
     LEFT JOIN clientes c ON c.id = s.cliente_id
     WHERE s.estado = 'Ativo' AND s.renovacao IS NOT NULL AND s.renovacao <= ?
     ORDER BY s.renovacao`,
    fim,
  );

  return [
    ...manutencoes.map((m) => ({
      id: `m${m.id}`,
      tipo: `Manutenção ${m.plano}`,
      cliente: m.cliente,
      renovacao: m.renovacao as string,
      valor: m.valor_mensal,
      ciclo: m.ciclo,
      atrasada: (m.renovacao as string) < inicio,
    })),
    ...servicos.map((s) => ({
      id: `s${s.id}`,
      tipo: s.tipo,
      cliente: s.cliente,
      renovacao: s.renovacao as string,
      valor: s.preco,
      ciclo: s.periodicidade,
      atrasada: (s.renovacao as string) < inicio,
    })),
  ].sort((a, b) => a.renovacao.localeCompare(b.renovacao));
}

/**
 * §4.9 / §4.10 — receita recorrente. Junta manutenções e serviços recorrentes e
 * normaliza tudo a mês, para MRR e ARR serem comparáveis entre ciclos.
 */
export async function recorrencia() {
  const manutencoes = await consulta<{ valor_mensal: number; ciclo: string; cliente_id: number | null }>(
    "SELECT valor_mensal, ciclo, cliente_id FROM manutencoes WHERE estado = 'Ativo'",
  );
  const servicos = await consulta<{
    preco: number;
    custo: number;
    periodicidade: string;
    cliente_id: number;
  }>("SELECT preco, custo, periodicidade, cliente_id FROM servicos_recorrentes WHERE estado = 'Ativo'");

  let mrr = 0;
  let custoMensal = 0;
  const clientes = new Set<number>();

  for (const m of manutencoes) {
    mrr += mensalizar(m.valor_mensal, m.ciclo);
    if (m.cliente_id) clientes.add(m.cliente_id);
  }
  for (const s of servicos) {
    mrr += mensalizar(s.preco, s.periodicidade);
    custoMensal += mensalizar(s.custo, s.periodicidade);
    clientes.add(s.cliente_id);
  }

  return {
    mrr,
    arr: mrr * 12,
    custoMensal,
    margemMensal: mrr - custoMensal,
    clientes: clientes.size,
    contratos: manutencoes.length + servicos.length,
  };
}

/** §4.4 — tudo o que interessa saber sobre um cliente, num só sítio. */
export async function resumoCliente(clienteId: number) {
  const financeiro = await primeiro<{ faturado: number; recebido: number; pendente: number }>(
    `SELECT COALESCE(SUM(CASE WHEN estado <> 'Anulada' THEN valor END), 0) AS faturado,
            COALESCE(SUM(CASE WHEN estado = 'Paga' THEN valor END), 0) AS recebido,
            COALESCE(SUM(CASE WHEN estado = 'Pendente' THEN valor END), 0) AS pendente
     FROM faturas WHERE cliente_id = ?`,
    clienteId,
  );
  const vencido = await primeiro<{ total: number }>(
    `SELECT COALESCE(SUM(valor), 0) AS total FROM faturas
     WHERE cliente_id = ? AND estado = 'Pendente' AND vence_em IS NOT NULL AND vence_em < ?`,
    clienteId,
    hoje(),
  );
  const projetos = await primeiro<{ n: number; ultimo: string | null }>(
    "SELECT COUNT(*) AS n, MAX(nome) AS ultimo FROM projetos WHERE cliente_id = ?",
    clienteId,
  );
  const manutencoes = await consulta<{ valor_mensal: number; ciclo: string }>(
    "SELECT valor_mensal, ciclo FROM manutencoes WHERE cliente_id = ? AND estado = 'Ativo'",
    clienteId,
  );
  const servicos = await consulta<{ preco: number; custo: number; periodicidade: string }>(
    "SELECT preco, custo, periodicidade FROM servicos_recorrentes WHERE cliente_id = ? AND estado = 'Ativo'",
    clienteId,
  );
  const ultima = await primeiro<Atividade>(
    `SELECT * FROM atividades WHERE cliente_id = ? AND concluida = 1
     ORDER BY data DESC, id DESC`,
    clienteId,
  );
  const proxima = await primeiro<Atividade>(
    `SELECT * FROM atividades WHERE cliente_id = ? AND concluida = 0 ORDER BY data, id`,
    clienteId,
  );

  const mrr =
    manutencoes.reduce((t, m) => t + mensalizar(m.valor_mensal, m.ciclo), 0) +
    servicos.reduce((t, s) => t + mensalizar(s.preco, s.periodicidade), 0);
  const custoRecorrente = servicos.reduce((t, s) => t + mensalizar(s.custo, s.periodicidade), 0);

  return {
    faturado: financeiro?.faturado ?? 0,
    recebido: financeiro?.recebido ?? 0,
    pendente: financeiro?.pendente ?? 0,
    vencido: vencido?.total ?? 0,
    projetos: projetos?.n ?? 0,
    mrr,
    arr: mrr * 12,
    margemRecorrente: mrr - custoRecorrente,
    servicosAtivos: manutencoes.length + servicos.length,
    ultima,
    proxima,
  };
}

export const listarTarefas = (projetoId: number) =>
  consulta<{ id: number; titulo: string; estado: string; prazo: string | null }>(
    "SELECT id, titulo, estado, prazo FROM tarefas WHERE projeto_id = ? ORDER BY estado, id",
    projetoId,
  );

/** §22 — indicadores do sistema financeiro. */
export async function indicadores() {
  const placeholders = FASES_ABERTAS.map(() => "?").join(",");
  const pipeline = await primeiro<{ total: number; n: number }>(
    `SELECT COALESCE(SUM(valor_estimado), 0) AS total, COUNT(*) AS n
     FROM leads WHERE fase IN (${placeholders})`,
    ...FASES_ABERTAS,
  );
  const recebido = await primeiro<{ total: number }>(
    "SELECT COALESCE(SUM(valor), 0) AS total FROM faturas WHERE estado = 'Paga'",
  );
  const emFalta = await primeiro<{ total: number }>(
    "SELECT COALESCE(SUM(valor), 0) AS total FROM faturas WHERE estado = 'Pendente'",
  );
  const mrr = await primeiro<{ total: number; n: number }>(
    "SELECT COALESCE(SUM(valor_mensal), 0) AS total, COUNT(*) AS n FROM manutencoes WHERE estado = 'Ativo'",
  );
  const projetosAtivos = await primeiro<{ n: number; preco: number; horas: number; reais: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(preco), 0) AS preco,
            COALESCE(SUM(horas_estimadas), 0) AS horas, COALESCE(SUM(horas_reais), 0) AS reais
     FROM projetos WHERE estado NOT IN ('Entregue')`,
  );
  const rentabilidade = await consulta<{
    id: number;
    nome: string;
    preco: number;
    horas_reais: number;
    custos_externos: number;
  }>(
    `SELECT id, nome, preco, horas_reais, custos_externos FROM projetos
     WHERE horas_reais > 0 ORDER BY (preco - custos_externos) / horas_reais ASC LIMIT 5`,
  );

  return {
    pipeline: pipeline ?? { total: 0, n: 0 },
    recebido: recebido?.total ?? 0,
    emFalta: emFalta?.total ?? 0,
    mrr: mrr ?? { total: 0, n: 0 },
    projetosAtivos: projetosAtivos ?? { n: 0, preco: 0, horas: 0, reais: 0 },
    rentabilidade,
  };
}

/**
 * §4.3 — métricas comerciais. Cada uma tem a sua própria consulta, para o
 * dashboard não ter de calcular nada a partir de listas carregadas em memória.
 */
export async function indicadoresComerciais() {
  const leads = await primeiro<{ total: number; ganhos: number; perdidos: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN fase IN ('Aceite','Contrato assinado','Pagamento inicial','Projeto ativo','Entregue','Manutenção') THEN 1 ELSE 0 END), 0) AS ganhos,
            COALESCE(SUM(CASE WHEN fase = 'Perdido' THEN 1 ELSE 0 END), 0) AS perdidos
     FROM leads`,
  );
  const propostas = await primeiro<{ total: number; aceites: number; valor_aceite: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN estado = 'Aceite' THEN 1 ELSE 0 END), 0) AS aceites,
            COALESCE(SUM(CASE WHEN estado = 'Aceite' THEN valor ELSE 0 END), 0) AS valor_aceite
     FROM propostas`,
  );
  const ticket = await primeiro<{ media: number | null }>(
    "SELECT AVG(preco) AS media FROM projetos WHERE preco > 0",
  );

  const total = leads?.total ?? 0;
  const decididos = (leads?.ganhos ?? 0) + (leads?.perdidos ?? 0);

  return {
    leads: total,
    ganhos: leads?.ganhos ?? 0,
    perdidos: leads?.perdidos ?? 0,
    // Sobre leads decididos, não sobre o total: leads ainda em aberto não são
    // uma derrota e diluíam a taxa sem razão.
    conversao: decididos ? (leads?.ganhos ?? 0) / decididos : 0,
    propostas: propostas?.total ?? 0,
    propostasAceites: propostas?.aceites ?? 0,
    aceitacao: propostas?.total ? (propostas.aceites ?? 0) / propostas.total : 0,
    ticketMedio: ticket?.media ?? 0,
  };
}

/** §4.3 — receita reconhecida no mês e no ano em curso. */
export async function receitaPeriodo() {
  const mes = hoje().slice(0, 7);
  const ano = hoje().slice(0, 4);
  const coluna = mesDe("COALESCE(paga_em, emitida_em, criado_em)");
  const linha = await primeiro<{ mes: number; ano: number }>(
    `SELECT COALESCE(SUM(CASE WHEN ${coluna} = ? THEN valor ELSE 0 END), 0) AS mes,
            COALESCE(SUM(CASE WHEN substr(COALESCE(paga_em, emitida_em, criado_em), 1, 4) = ? THEN valor ELSE 0 END), 0) AS ano
     FROM faturas WHERE estado = 'Paga'`,
    mes,
    ano,
  );
  return { mes: linha?.mes ?? 0, ano: linha?.ano ?? 0 };
}

/**
 * §4.3 — projetos em risco: entrega prevista já passada sem estar entregue, ou
 * horas reais a ultrapassar as estimadas.
 */
export const projetosEmRisco = (dia = hoje()) =>
  consulta<{
    id: number;
    nome: string;
    estado: string;
    entrega_prevista: string | null;
    horas_estimadas: number;
    horas_reais: number;
    cliente: string | null;
  }>(
    `SELECT p.id, p.nome, p.estado, p.entrega_prevista, p.horas_estimadas, p.horas_reais,
            c.empresa AS cliente
     FROM projetos p
     LEFT JOIN clientes c ON c.id = p.cliente_id
     WHERE p.estado <> 'Entregue'
       AND ((p.entrega_prevista IS NOT NULL AND p.entrega_prevista < ?)
            OR (p.horas_estimadas > 0 AND p.horas_reais > p.horas_estimadas))
     ORDER BY COALESCE(p.entrega_prevista, '9999')`,
    dia,
  );

/** §4.2 — leads em aberto sem nenhuma atividade pendente marcada. */
export const leadsSemFollowUp = () =>
  consulta<Lead>(
    `SELECT l.* FROM leads l
     WHERE l.fase IN (${FASES_ABERTAS.map(() => "?").join(",")})
       AND NOT EXISTS (SELECT 1 FROM atividades a WHERE a.lead_id = l.id AND a.concluida = 0)
     ORDER BY l.atualizado_em`,
    ...FASES_ABERTAS,
  );

/** Faturação dos últimos 6 meses, separada entre recebido e pendente. */
export async function faturacaoMensal() {
  const coluna = mesDe("COALESCE(paga_em, emitida_em, criado_em)");
  const linhas = await consulta<{ mes: string; estado: string; total: number }>(
    `SELECT ${coluna} AS mes, estado, SUM(valor) AS total
     FROM faturas
     WHERE estado <> 'Anulada'
     GROUP BY ${coluna}, estado`,
  );

  const meses: { mes: string; etiqueta: string; recebido: number; pendente: number }[] = [];
  const agora = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      mes,
      etiqueta: d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", ""),
      recebido: 0,
      pendente: 0,
    });
  }

  for (const l of linhas) {
    const alvo = meses.find((m) => m.mes === l.mes);
    if (!alvo) continue;
    if (l.estado === "Paga") alvo.recebido += l.total;
    else alvo.pendente += l.total;
  }
  return meses;
}

export async function contagemPorFase() {
  const linhas = await consulta<{ fase: string; n: number; total: number }>(
    "SELECT fase, COUNT(*) AS n, COALESCE(SUM(valor_estimado),0) AS total FROM leads GROUP BY fase",
  );
  return new Map(linhas.map((l) => [l.fase, l]));
}
