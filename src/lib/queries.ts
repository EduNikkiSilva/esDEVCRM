import { consulta, primeiro } from "@/lib/db";
import { FASES_ABERTAS } from "@/lib/dominio";

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
  nivel: string;
  valor: number;
  mensalidade: number;
  validade_dias: number;
  estado: string;
  ambito: string | null;
  exclusoes: string | null;
  rondas_alteracoes: number;
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
  notas: string | null;
};

export const listarClientes = () =>
  consulta<Cliente>("SELECT * FROM clientes ORDER BY empresa COLLATE NOCASE");

export const obterCliente = (id: number) =>
  primeiro<Cliente>("SELECT * FROM clientes WHERE id = ?", id);

export const listarLeads = () =>
  consulta<Lead>("SELECT * FROM leads ORDER BY datetime(atualizado_em) DESC");

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
         ORDER BY f.estado = 'Paga', datetime(COALESCE(f.emitida_em, f.criado_em)) DESC`,
      );

export const projetosDoCliente = (clienteId: number) =>
  consulta<Projeto>("SELECT * FROM projetos WHERE cliente_id = ? ORDER BY id DESC", clienteId);

export const faturasDoCliente = (clienteId: number) =>
  consulta<Fatura>(
    "SELECT * FROM faturas WHERE cliente_id = ? ORDER BY estado = 'Paga', id DESC",
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

export const listarTarefas = (projetoId: number) =>
  consulta<{ id: number; titulo: string; estado: string; prazo: string | null }>(
    "SELECT id, titulo, estado, prazo FROM tarefas WHERE projeto_id = ? ORDER BY estado, id",
    projetoId,
  );

/** §22 — indicadores do sistema financeiro. */
export function indicadores() {
  const placeholders = FASES_ABERTAS.map(() => "?").join(",");
  const pipeline = primeiro<{ total: number; n: number }>(
    `SELECT COALESCE(SUM(valor_estimado), 0) AS total, COUNT(*) AS n
     FROM leads WHERE fase IN (${placeholders})`,
    ...FASES_ABERTAS,
  );
  const recebido = primeiro<{ total: number }>(
    "SELECT COALESCE(SUM(valor), 0) AS total FROM faturas WHERE estado = 'Paga'",
  );
  const emFalta = primeiro<{ total: number }>(
    "SELECT COALESCE(SUM(valor), 0) AS total FROM faturas WHERE estado = 'Pendente'",
  );
  const mrr = primeiro<{ total: number; n: number }>(
    "SELECT COALESCE(SUM(valor_mensal), 0) AS total, COUNT(*) AS n FROM manutencoes WHERE estado = 'Ativo'",
  );
  const projetosAtivos = primeiro<{ n: number; preco: number; horas: number; reais: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(preco), 0) AS preco,
            COALESCE(SUM(horas_estimadas), 0) AS horas, COALESCE(SUM(horas_reais), 0) AS reais
     FROM projetos WHERE estado NOT IN ('Entregue')`,
  );
  const rentabilidade = consulta<{
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

/** Faturação dos últimos 6 meses, separada entre recebido e pendente. */
export function faturacaoMensal() {
  const linhas = consulta<{ mes: string; estado: string; total: number }>(
    `SELECT strftime('%Y-%m', COALESCE(paga_em, emitida_em, criado_em)) AS mes,
            estado, SUM(valor) AS total
     FROM faturas
     WHERE estado <> 'Anulada'
     GROUP BY mes, estado`,
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

export function contagemPorFase() {
  const linhas = consulta<{ fase: string; n: number; total: number }>(
    "SELECT fase, COUNT(*) AS n, COALESCE(SUM(valor_estimado),0) AS total FROM leads GROUP BY fase",
  );
  return new Map(linhas.map((l) => [l.fase, l]));
}
