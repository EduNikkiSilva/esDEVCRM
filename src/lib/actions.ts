"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hoje, proximaRenovacao, somarDias, somarMeses } from "@/lib/datas";
import { AGORA, HOJE, executa, insere, primeiro } from "@/lib/db";
import { MESES_CICLO, PLANOS_PAGAMENTO, type Periodicidade } from "@/lib/dominio";
import { CHAVE } from "@/lib/logo";
import { calcularPreco, type InputsCalculadora } from "@/lib/pricing";

const texto = (fd: FormData, campo: string) => {
  const v = fd.get(campo);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};

const numero = (fd: FormData, campo: string) => {
  const v = Number(String(fd.get(campo) ?? "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

function refrescar(...caminhos: string[]) {
  for (const c of caminhos) revalidatePath(c);
}

// --- Leads -------------------------------------------------------------------

export async function criarLead(fd: FormData) {
  const res = await insere(
    `INSERT INTO leads (empresa, contacto_nome, email, telefone, origem, responsavel, fase,
                        tipo_solucao, orcamento_indicado, valor_estimado, notas)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    texto(fd, "empresa") ?? "Sem nome",
    texto(fd, "contacto_nome"),
    texto(fd, "email"),
    texto(fd, "telefone"),
    texto(fd, "origem"),
    texto(fd, "responsavel"),
    texto(fd, "fase") ?? "Novo Lead",
    texto(fd, "tipo_solucao"),
    texto(fd, "orcamento_indicado"),
    numero(fd, "valor_estimado"),
    texto(fd, "notas"),
  );
  const leadId = Number(res.lastInsertRowid);

  // Um lead sem próxima ação marcada perde-se; a primeira é criada logo.
  const primeiroContacto = texto(fd, "primeiro_contacto");
  if (primeiroContacto) {
    await executa(
      "INSERT INTO atividades (lead_id, tipo, titulo, data) VALUES (?,?,?,?)",
      leadId,
      "Contacto",
      "Primeiro contacto",
      primeiroContacto,
    );
  }

  refrescar("/", "/leads");
  redirect(`/leads/${leadId}`);
}

export async function atualizarLead(fd: FormData) {
  const id = numero(fd, "id");
  await executa(
    `UPDATE leads SET empresa=?, contacto_nome=?, email=?, telefone=?, origem=?, responsavel=?,
       fase=?, tipo_solucao=?, orcamento_indicado=?, valor_estimado=?, motivo_perda=?, notas=?,
       atualizado_em=${AGORA} WHERE id=?`,
    texto(fd, "empresa") ?? "Sem nome",
    texto(fd, "contacto_nome"),
    texto(fd, "email"),
    texto(fd, "telefone"),
    texto(fd, "origem"),
    texto(fd, "responsavel"),
    texto(fd, "fase") ?? "Novo Lead",
    texto(fd, "tipo_solucao"),
    texto(fd, "orcamento_indicado"),
    numero(fd, "valor_estimado"),
    texto(fd, "motivo_perda"),
    texto(fd, "notas"),
    id,
  );
  refrescar("/", "/leads", `/leads/${id}`);
}

export async function mudarFaseLead(id: number, fase: string) {
  await executa(`UPDATE leads SET fase=?, atualizado_em=${AGORA} WHERE id=?`, fase, id);
  refrescar("/", "/leads", `/leads/${id}`);
}

export async function registarPerda(fd: FormData) {
  const id = numero(fd, "id");
  await executa(
    `UPDATE leads SET fase='Perdido', motivo_perda=?, atualizado_em=${AGORA} WHERE id=?`,
    texto(fd, "motivo_perda"),
    id,
  );
  // Uma lead perdida não tem próximas ações; deixá-las pendentes enchia o "Hoje".
  await executa(
    `UPDATE atividades SET concluida=1, concluida_em=${HOJE}, atualizado_em=${AGORA}
     WHERE lead_id=? AND concluida=0`,
    id,
  );
  refrescar("/", "/leads", `/leads/${id}`);
}

export async function apagarLead(fd: FormData) {
  await executa("DELETE FROM leads WHERE id=?", numero(fd, "id"));
  refrescar("/", "/leads");
  redirect("/leads");
}

// --- Atividades --------------------------------------------------------------

/** Caminhos a revalidar consoante o alvo da atividade. */
function caminhosAtividade(a: {
  lead_id?: number | null;
  cliente_id?: number | null;
  projeto_id?: number | null;
}) {
  const caminhos = ["/"];
  if (a.lead_id) caminhos.push("/leads", `/leads/${a.lead_id}`);
  if (a.cliente_id) caminhos.push("/clientes", `/clientes/${a.cliente_id}`);
  if (a.projeto_id) caminhos.push("/projetos", `/projetos/${a.projeto_id}`);
  return caminhos;
}

export async function criarAtividade(fd: FormData) {
  const alvo = {
    lead_id: numero(fd, "lead_id") || null,
    cliente_id: numero(fd, "cliente_id") || null,
    projeto_id: numero(fd, "projeto_id") || null,
  };
  const concluida = fd.get("concluida") === "1" || fd.get("concluida") === "on";
  await executa(
    `INSERT INTO atividades (lead_id, cliente_id, projeto_id, tipo, titulo, descricao, data, hora,
                             concluida, concluida_em)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    alvo.lead_id,
    alvo.cliente_id,
    alvo.projeto_id,
    texto(fd, "tipo") ?? "Nota",
    texto(fd, "titulo") ?? "Atividade",
    texto(fd, "descricao"),
    texto(fd, "data") ?? hoje(),
    texto(fd, "hora"),
    concluida,
    concluida ? hoje() : null,
  );

  // Registar contacto move a lead para "Contactado" se ainda estiver por tocar.
  if (alvo.lead_id && concluida) {
    await executa(
      `UPDATE leads SET fase='Contactado', atualizado_em=${AGORA}
       WHERE id=? AND fase='Novo Lead'`,
      alvo.lead_id,
    );
  }
  refrescar(...caminhosAtividade(alvo));
}

/** Follow-up rápido: usado no pipeline, sem sair da página. */
export async function agendarFollowUp(leadId: number, data: string, titulo?: string) {
  await executa(
    "INSERT INTO atividades (lead_id, tipo, titulo, data) VALUES (?,?,?,?)",
    leadId,
    "Follow-up",
    titulo?.trim() || "Follow-up",
    data,
  );
  refrescar("/", "/leads", `/leads/${leadId}`);
}

export async function alternarAtividade(fd: FormData) {
  const id = numero(fd, "id");
  const a = await primeiro<{
    concluida: number;
    lead_id: number | null;
    cliente_id: number | null;
    projeto_id: number | null;
  }>("SELECT concluida, lead_id, cliente_id, projeto_id FROM atividades WHERE id=?", id);
  if (!a) return;
  const passaAConcluida = !a.concluida;
  await executa(
    `UPDATE atividades SET concluida=?, concluida_em=?, atualizado_em=${AGORA} WHERE id=?`,
    passaAConcluida,
    passaAConcluida ? hoje() : null,
    id,
  );
  refrescar(...caminhosAtividade(a));
}

export async function atualizarAtividade(fd: FormData) {
  const id = numero(fd, "id");
  const a = await primeiro<{ lead_id: number | null; cliente_id: number | null; projeto_id: number | null }>(
    "SELECT lead_id, cliente_id, projeto_id FROM atividades WHERE id=?",
    id,
  );
  await executa(
    `UPDATE atividades SET tipo=?, titulo=?, descricao=?, data=?, hora=?, atualizado_em=${AGORA}
     WHERE id=?`,
    texto(fd, "tipo") ?? "Nota",
    texto(fd, "titulo") ?? "Atividade",
    texto(fd, "descricao"),
    texto(fd, "data") ?? hoje(),
    texto(fd, "hora"),
    id,
  );
  refrescar(...caminhosAtividade(a ?? {}));
}

export async function apagarAtividade(fd: FormData) {
  const id = numero(fd, "id");
  const a = await primeiro<{ lead_id: number | null; cliente_id: number | null; projeto_id: number | null }>(
    "SELECT lead_id, cliente_id, projeto_id FROM atividades WHERE id=?",
    id,
  );
  await executa("DELETE FROM atividades WHERE id=?", id);
  refrescar(...caminhosAtividade(a ?? {}));
}

/** Adiar uma ação pendente por N dias, a partir da data atual da atividade. */
export async function adiarAtividade(fd: FormData) {
  const id = numero(fd, "id");
  const dias = numero(fd, "dias") || 1;
  const a = await primeiro<{
    data: string;
    lead_id: number | null;
    cliente_id: number | null;
    projeto_id: number | null;
  }>("SELECT data, lead_id, cliente_id, projeto_id FROM atividades WHERE id=?", id);
  if (!a) return;
  // Atrasada: adiar a partir de hoje, senão continuaria no passado.
  const base = a.data < hoje() ? hoje() : a.data;
  await executa(
    `UPDATE atividades SET data=?, atualizado_em=${AGORA} WHERE id=?`,
    somarDias(base, dias),
    id,
  );
  refrescar(...caminhosAtividade(a));
}

// --- Contactos ---------------------------------------------------------------

export async function guardarContacto(fd: FormData) {
  const id = numero(fd, "id");
  const clienteId = numero(fd, "cliente_id");
  const principal = fd.get("principal") === "1" || fd.get("principal") === "on";
  const campos = [
    texto(fd, "nome") ?? "Sem nome",
    texto(fd, "cargo"),
    texto(fd, "email"),
    texto(fd, "telefone"),
    principal,
    texto(fd, "notas"),
  ];
  if (id) {
    await executa(
      "UPDATE contactos SET nome=?, cargo=?, email=?, telefone=?, principal=?, notas=? WHERE id=?",
      ...campos,
      id,
    );
  } else {
    await executa(
      "INSERT INTO contactos (nome, cargo, email, telefone, principal, notas, cliente_id) VALUES (?,?,?,?,?,?,?)",
      ...campos,
      clienteId,
    );
  }
  // Só pode haver um principal por cliente.
  if (principal) {
    await executa(
      `UPDATE contactos SET principal=0
       WHERE cliente_id=? AND id <> (SELECT MAX(id) FROM contactos WHERE cliente_id=? AND principal=1)`,
      clienteId,
      clienteId,
    );
  }
  refrescar("/clientes", `/clientes/${clienteId}`);
}

export async function apagarContacto(fd: FormData) {
  const clienteId = numero(fd, "cliente_id");
  await executa("DELETE FROM contactos WHERE id=?", numero(fd, "id"));
  refrescar("/clientes", `/clientes/${clienteId}`);
}

/**
 * §4.5 — migração gradual: transforma os campos contacto_* do cliente num
 * registo em `contactos`, sem os apagar do cliente.
 */
export async function migrarContactoDoCliente(fd: FormData) {
  const clienteId = numero(fd, "cliente_id");
  const c = await primeiro<{
    contacto_nome: string | null;
    contacto_cargo: string | null;
    email: string | null;
    telefone: string | null;
  }>("SELECT contacto_nome, contacto_cargo, email, telefone FROM clientes WHERE id=?", clienteId);
  if (!c?.contacto_nome) return;
  const existe = await primeiro<{ id: number }>(
    "SELECT id FROM contactos WHERE cliente_id=? AND nome=?",
    clienteId,
    c.contacto_nome,
  );
  if (existe) return;
  await executa(
    "INSERT INTO contactos (cliente_id, nome, cargo, email, telefone, principal) VALUES (?,?,?,?,?,1)",
    clienteId,
    c.contacto_nome,
    c.contacto_cargo,
    c.email,
    c.telefone,
  );
  refrescar(`/clientes/${clienteId}`);
}

// --- Contratos ---------------------------------------------------------------

export async function guardarContrato(fd: FormData) {
  const id = numero(fd, "id");
  const clienteId = numero(fd, "cliente_id") || null;
  const campos = [
    clienteId,
    numero(fd, "proposta_id") || null,
    numero(fd, "projeto_id") || null,
    texto(fd, "titulo") ?? "Contrato",
    texto(fd, "estado") ?? "Pendente",
    texto(fd, "data"),
    texto(fd, "ficheiro"),
    texto(fd, "notas"),
  ];
  if (id) {
    await executa(
      `UPDATE contratos SET cliente_id=?, proposta_id=?, projeto_id=?, titulo=?, estado=?,
        data=?, ficheiro=?, notas=? WHERE id=?`,
      ...campos,
      id,
    );
  } else {
    await executa(
      `INSERT INTO contratos (cliente_id, proposta_id, projeto_id, titulo, estado, data, ficheiro, notas)
       VALUES (?,?,?,?,?,?,?,?)`,
      ...campos,
    );
  }
  refrescar("/clientes", clienteId ? `/clientes/${clienteId}` : "/clientes");
}

export async function apagarContrato(fd: FormData) {
  const clienteId = numero(fd, "cliente_id");
  await executa("DELETE FROM contratos WHERE id=?", numero(fd, "id"));
  refrescar("/clientes", clienteId ? `/clientes/${clienteId}` : "/clientes");
}

// --- Serviços recorrentes ----------------------------------------------------

export async function guardarServicoRecorrente(fd: FormData) {
  const id = numero(fd, "id");
  const clienteId = numero(fd, "cliente_id");
  const periodicidade = texto(fd, "periodicidade") ?? "Mensal";
  const inicio = texto(fd, "inicio");
  const campos = [
    clienteId,
    numero(fd, "projeto_id") || null,
    texto(fd, "tipo") ?? "Manutenção",
    texto(fd, "descricao"),
    texto(fd, "fornecedor"),
    numero(fd, "custo"),
    numero(fd, "preco"),
    periodicidade,
    inicio,
    // A renovação é derivada do início quando não é indicada, para não ficar
    // um serviço ativo sem data de renovação — o alerta dependeria dela.
    texto(fd, "renovacao") ?? proximaRenovacao(inicio, periodicidade),
    texto(fd, "estado") ?? "Ativo",
    texto(fd, "notas"),
  ];
  if (id) {
    await executa(
      `UPDATE servicos_recorrentes SET cliente_id=?, projeto_id=?, tipo=?, descricao=?, fornecedor=?,
        custo=?, preco=?, periodicidade=?, inicio=?, renovacao=?, estado=?, notas=? WHERE id=?`,
      ...campos,
      id,
    );
  } else {
    await executa(
      `INSERT INTO servicos_recorrentes (cliente_id, projeto_id, tipo, descricao, fornecedor, custo,
        preco, periodicidade, inicio, renovacao, estado, notas)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      ...campos,
    );
  }
  refrescar("/", "/manutencao", "/clientes", clienteId ? `/clientes/${clienteId}` : "/clientes");
}

export async function apagarServicoRecorrente(fd: FormData) {
  const clienteId = numero(fd, "cliente_id");
  await executa("DELETE FROM servicos_recorrentes WHERE id=?", numero(fd, "id"));
  refrescar("/", "/manutencao", clienteId ? `/clientes/${clienteId}` : "/clientes");
}

/** Avança a renovação um ciclo — o gesto que se faz quando o serviço é renovado. */
export async function renovarServico(fd: FormData) {
  const id = numero(fd, "id");
  const s = await primeiro<{ renovacao: string | null; periodicidade: string; cliente_id: number }>(
    "SELECT renovacao, periodicidade, cliente_id FROM servicos_recorrentes WHERE id=?",
    id,
  );
  if (!s) return;
  const base = s.renovacao ?? hoje();
  await executa(
    "UPDATE servicos_recorrentes SET renovacao=? WHERE id=?",
    somarMeses(base, MESES_CICLO[s.periodicidade as Periodicidade] ?? 1),
    id,
  );
  refrescar("/", "/manutencao", `/clientes/${s.cliente_id}`);
}

export async function renovarManutencao(fd: FormData) {
  const id = numero(fd, "id");
  const m = await primeiro<{ renovacao: string | null; ciclo: string; cliente_id: number | null }>(
    "SELECT renovacao, ciclo, cliente_id FROM manutencoes WHERE id=?",
    id,
  );
  if (!m) return;
  const base = m.renovacao ?? hoje();
  await executa(
    "UPDATE manutencoes SET renovacao=? WHERE id=?",
    somarMeses(base, MESES_CICLO[m.ciclo as Periodicidade] ?? 1),
    id,
  );
  refrescar("/", "/manutencao", m.cliente_id ? `/clientes/${m.cliente_id}` : "/manutencao");
}

// --- Briefing ----------------------------------------------------------------

export async function guardarBriefing(leadId: number, dados: Record<string, unknown>) {
  await executa(
    `INSERT INTO briefings (lead_id, dados, atualizado_em) VALUES (?,?,${AGORA})
     ON CONFLICT(lead_id) DO UPDATE SET dados=excluded.dados, atualizado_em=${AGORA}`,
    leadId,
    JSON.stringify(dados),
  );
  refrescar(`/leads/${leadId}`);
}

// --- Análise interna / calculadora ------------------------------------------

export async function guardarAnalise(
  inputs: InputsCalculadora,
  opcoes: { leadId?: number | null; titulo?: string } = {},
) {
  const r = calcularPreco(inputs);
  const res = await insere(
    `INSERT INTO analises (lead_id, titulo, inputs, preco_minimo, preco_recomendado, preco_premium,
                           mensalidade, plano_manutencao, horas_estimadas, valor_hora)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    opcoes.leadId ?? null,
    opcoes.titulo ?? r.pacote.nome,
    JSON.stringify(inputs),
    r.precoFinal.minimo,
    r.precoFinal.recomendado,
    r.precoFinal.premium,
    r.manutencao.valor,
    r.manutencao.plano,
    inputs.horasEstimadas,
    r.valorHora,
  );

  if (opcoes.leadId) {
    await executa(
      `UPDATE leads SET valor_estimado=?, atualizado_em=${AGORA} WHERE id=?`,
      r.precoFinal.recomendado,
      opcoes.leadId,
    );
    refrescar("/", "/leads", `/leads/${opcoes.leadId}`);
  }
  refrescar("/calculadora");
  return Number(res.lastInsertRowid);
}

// --- Propostas ---------------------------------------------------------------

/** Número sequencial por ano: P2026-001, P2026-002, … */
async function proximoNumeroProposta() {
  const ano = hoje().slice(0, 4);
  const r = await primeiro<{ n: number }>(
    "SELECT COUNT(*) AS n FROM propostas WHERE numero LIKE ?",
    `P${ano}-%`,
  );
  return `P${ano}-${String((r?.n ?? 0) + 1).padStart(3, "0")}`;
}

export async function criarProposta(fd: FormData) {
  const leadId = numero(fd, "lead_id");
  const estado = texto(fd, "estado") ?? "Rascunho";
  const validade = numero(fd, "validade_dias") || 30;
  const enviada = estado === "Rascunho" ? null : hoje();
  await executa(
    `INSERT INTO propostas (lead_id, analise_id, numero, nivel, valor, mensalidade, validade_dias,
                            estado, ambito, exclusoes, condicoes, observacoes, rondas_alteracoes,
                            enviada_em, expira_em)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    leadId,
    numero(fd, "analise_id") || null,
    await proximoNumeroProposta(),
    texto(fd, "nivel") ?? "BUSINESS",
    numero(fd, "valor"),
    numero(fd, "mensalidade"),
    validade,
    estado,
    texto(fd, "ambito"),
    texto(fd, "exclusoes"),
    texto(fd, "condicoes"),
    texto(fd, "observacoes"),
    numero(fd, "rondas_alteracoes") || 2,
    enviada,
    enviada ? somarDias(enviada, validade) : null,
  );
  refrescar(`/leads/${leadId}`, "/propostas", "/");
}

export async function atualizarProposta(fd: FormData) {
  const id = numero(fd, "id");
  const leadId = numero(fd, "lead_id");
  await executa(
    `UPDATE propostas SET nivel=?, valor=?, mensalidade=?, validade_dias=?, ambito=?, exclusoes=?,
       condicoes=?, observacoes=?, rondas_alteracoes=?, enviada_em=?, expira_em=? WHERE id=?`,
    texto(fd, "nivel") ?? "BUSINESS",
    numero(fd, "valor"),
    numero(fd, "mensalidade"),
    numero(fd, "validade_dias") || 30,
    texto(fd, "ambito"),
    texto(fd, "exclusoes"),
    texto(fd, "condicoes"),
    texto(fd, "observacoes"),
    numero(fd, "rondas_alteracoes") || 2,
    texto(fd, "enviada_em"),
    texto(fd, "expira_em"),
    id,
  );
  refrescar(`/leads/${leadId}`, "/propostas", "/");
}

/** A fase da lead que corresponde a cada estado de proposta. */
const FASE_POR_ESTADO_PROPOSTA: Record<string, string> = {
  Enviada: "Proposta enviada",
  Visualizada: "Proposta enviada",
  Negociação: "Negociação",
  Aceite: "Aceite",
  Recusada: "Perdido",
};

export async function mudarEstadoProposta(fd: FormData) {
  const id = numero(fd, "id");
  const estado = texto(fd, "estado") ?? "Rascunho";
  const p = await primeiro<{
    lead_id: number;
    valor: number;
    numero: string | null;
    validade_dias: number;
    enviada_em: string | null;
  }>("SELECT lead_id, valor, numero, validade_dias, enviada_em FROM propostas WHERE id=?", id);
  if (!p) return;

  // As datas seguem o estado: enviada marca o início da validade, e uma resposta
  // (aceite ou recusa) marca a data de decisão.
  const enviada = p.enviada_em ?? (estado === "Rascunho" ? null : hoje());
  const respondida = ["Aceite", "Recusada"].includes(estado) ? hoje() : null;
  await executa(
    "UPDATE propostas SET estado=?, enviada_em=?, expira_em=?, respondida_em=? WHERE id=?",
    estado,
    enviada,
    enviada ? somarDias(enviada, p.validade_dias || 30) : null,
    respondida,
    id,
  );

  const fase = FASE_POR_ESTADO_PROPOSTA[estado];
  if (fase) {
    await executa(
      `UPDATE leads SET fase=?, valor_estimado=?, atualizado_em=${AGORA} WHERE id=?`,
      fase,
      p.valor,
      p.lead_id,
    );
  }

  // §4.6 — uma proposta enviada precisa de follow-up marcado, senão morre.
  if (estado === "Enviada") {
    const pendente = await primeiro<{ id: number }>(
      "SELECT id FROM atividades WHERE lead_id=? AND concluida=0",
      p.lead_id,
    );
    if (!pendente) {
      await executa(
        "INSERT INTO atividades (lead_id, tipo, titulo, data) VALUES (?,?,?,?)",
        p.lead_id,
        "Follow-up",
        `Follow-up da proposta ${p.numero ?? ""}`.trim(),
        somarDias(hoje(), 3),
      );
    }
  }

  // §4.7 — a proposta aceite origina o contrato, que a V1.2 vai usar a fundo.
  if (estado === "Aceite") {
    const lead = await primeiro<{ cliente_id: number | null; empresa: string }>(
      "SELECT cliente_id, empresa FROM leads WHERE id=?",
      p.lead_id,
    );
    const existe = await primeiro<{ id: number }>("SELECT id FROM contratos WHERE proposta_id=?", id);
    if (!existe) {
      await executa(
        "INSERT INTO contratos (cliente_id, proposta_id, titulo, estado) VALUES (?,?,?,'Pendente')",
        lead?.cliente_id ?? null,
        id,
        `Contrato — ${lead?.empresa ?? "cliente"} (${p.numero ?? `proposta ${id}`})`,
      );
    }
  }

  refrescar("/", "/leads", `/leads/${p.lead_id}`, "/propostas", "/clientes");
}

/**
 * §4.6 — marca como expiradas as propostas em aberto cuja validade passou.
 * Chamada pelo dashboard: sem tarefas agendadas, é o momento natural para o fazer.
 */
export async function expirarPropostas() {
  await executa(
    `UPDATE propostas SET estado='Expirada'
     WHERE estado IN ('Enviada','Visualizada') AND expira_em IS NOT NULL AND expira_em < ?`,
    hoje(),
  );
}

// --- Conversão em projeto ----------------------------------------------------

/** Cria cliente (se necessário), projeto, plano de faturação e manutenção. */
export async function converterEmProjeto(fd: FormData) {
  const leadId = numero(fd, "lead_id");
  const lead = await primeiro<{
    empresa: string;
    contacto_nome: string | null;
    email: string | null;
    telefone: string | null;
    cliente_id: number | null;
    valor_estimado: number;
  }>("SELECT empresa, contacto_nome, email, telefone, cliente_id, valor_estimado FROM leads WHERE id=?", leadId);
  if (!lead) return;

  let clienteId = lead.cliente_id;
  if (!clienteId) {
    const res = await insere(
      "INSERT INTO clientes (empresa, contacto_nome, email, telefone) VALUES (?,?,?,?)",
      lead.empresa,
      lead.contacto_nome,
      lead.email,
      lead.telefone,
    );
    clienteId = Number(res.lastInsertRowid);
    await executa("UPDATE leads SET cliente_id=? WHERE id=?", clienteId, leadId);
  }

  const preco = numero(fd, "preco") || lead.valor_estimado;
  const projeto = await insere(
    `INSERT INTO projetos (cliente_id, lead_id, nome, pacote, estado, preco, custos_externos,
                           horas_estimadas, inicio, entrega_prevista, checklist, notas)
     VALUES (?,?,?,?,?,?,?,?,?,?,'[]',?)`,
    clienteId,
    leadId,
    texto(fd, "nome") ?? lead.empresa,
    texto(fd, "pacote"),
    "Kick-off",
    preco,
    numero(fd, "custos_externos"),
    numero(fd, "horas_estimadas"),
    texto(fd, "inicio"),
    texto(fd, "entrega_prevista"),
    texto(fd, "notas"),
  );
  const projetoId = Number(projeto.lastInsertRowid);

  const plano = PLANOS_PAGAMENTO.find((p) => p.id === texto(fd, "plano_pagamento")) ?? PLANOS_PAGAMENTO[0];
  for (const marco of plano.marcos) {
    await executa(
      "INSERT INTO faturas (projeto_id, cliente_id, descricao, tipo, valor, estado) VALUES (?,?,?,?,?,'Pendente')",
      projetoId,
      clienteId,
      marco.descricao,
      marco.tipo,
      Math.round(preco * marco.peso),
    );
  }

  const mensalidade = numero(fd, "mensalidade");
  if (mensalidade > 0) {
    const inicioManutencao = texto(fd, "entrega_prevista");
    await executa(
      `INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio, ciclo, renovacao)
       VALUES (?,?,?,?,'Ativo',?,'Mensal',?)`,
      clienteId,
      projetoId,
      texto(fd, "plano_manutencao") ?? "basic",
      mensalidade,
      inicioManutencao,
      proximaRenovacao(inicioManutencao, "Mensal"),
    );
  }

  // O histórico do cliente começa no que já aconteceu com a lead.
  await executa(
    "UPDATE atividades SET cliente_id=? WHERE lead_id=? AND cliente_id IS NULL",
    clienteId,
    leadId,
  );
  await executa(
    "INSERT INTO atividades (lead_id, cliente_id, projeto_id, tipo, titulo, data, concluida, concluida_em) VALUES (?,?,?,?,?,?,1,?)",
    leadId,
    clienteId,
    projetoId,
    "Nota",
    "Projeto adjudicado",
    hoje(),
    hoje(),
  );

  await executa(`UPDATE leads SET fase='Projeto ativo', atualizado_em=${AGORA} WHERE id=?`, leadId);
  refrescar("/", "/leads", `/leads/${leadId}`, "/projetos", "/clientes", "/faturas", "/manutencao");
  redirect(`/projetos/${projetoId}`);
}

// --- Clientes ----------------------------------------------------------------

export async function guardarCliente(fd: FormData) {
  const id = numero(fd, "id");
  const campos = [
    texto(fd, "empresa") ?? "Sem nome",
    texto(fd, "nif"),
    texto(fd, "contacto_nome"),
    texto(fd, "contacto_cargo"),
    texto(fd, "email"),
    texto(fd, "telefone"),
    texto(fd, "website"),
    texto(fd, "notas"),
  ];
  if (id) {
    await executa(
      `UPDATE clientes SET empresa=?, nif=?, contacto_nome=?, contacto_cargo=?, email=?,
        telefone=?, website=?, notas=? WHERE id=?`,
      ...campos,
      id,
    );
  } else {
    await executa(
      `INSERT INTO clientes (empresa, nif, contacto_nome, contacto_cargo, email, telefone, website, notas)
       VALUES (?,?,?,?,?,?,?,?)`,
      ...campos,
    );
  }
  refrescar("/clientes", "/");
}

export async function apagarCliente(fd: FormData) {
  await executa("DELETE FROM clientes WHERE id=?", numero(fd, "id"));
  refrescar("/clientes");
}

// --- Projetos ----------------------------------------------------------------

export async function atualizarProjeto(fd: FormData) {
  const id = numero(fd, "id");
  await executa(
    `UPDATE projetos SET nome=?, pacote=?, estado=?, preco=?, custos_externos=?, horas_estimadas=?,
       horas_reais=?, inicio=?, entrega_prevista=?, notas=? WHERE id=?`,
    texto(fd, "nome") ?? "Projeto",
    texto(fd, "pacote"),
    texto(fd, "estado") ?? "Kick-off",
    numero(fd, "preco"),
    numero(fd, "custos_externos"),
    numero(fd, "horas_estimadas"),
    numero(fd, "horas_reais"),
    texto(fd, "inicio"),
    texto(fd, "entrega_prevista"),
    texto(fd, "notas"),
    id,
  );
  refrescar("/", "/projetos", `/projetos/${id}`);
}

export async function guardarChecklist(projetoId: number, itens: string[]) {
  await executa("UPDATE projetos SET checklist=? WHERE id=?", JSON.stringify(itens), projetoId);
  refrescar(`/projetos/${projetoId}`);
}

export async function registarHoras(fd: FormData) {
  const id = numero(fd, "id");
  await executa("UPDATE projetos SET horas_reais = horas_reais + ? WHERE id=?", numero(fd, "horas"), id);
  refrescar("/", "/projetos", `/projetos/${id}`);
}

// --- Tarefas -----------------------------------------------------------------

export async function criarTarefa(fd: FormData) {
  const projetoId = numero(fd, "projeto_id");
  await executa(
    "INSERT INTO tarefas (projeto_id, titulo, prazo) VALUES (?,?,?)",
    projetoId,
    texto(fd, "titulo") ?? "Tarefa",
    texto(fd, "prazo"),
  );
  refrescar(`/projetos/${projetoId}`);
}

export async function alternarTarefa(fd: FormData) {
  const id = numero(fd, "id");
  const projetoId = numero(fd, "projeto_id");
  await executa(
    "UPDATE tarefas SET estado = CASE estado WHEN 'Aberta' THEN 'Concluída' ELSE 'Aberta' END WHERE id=?",
    id,
  );
  refrescar(`/projetos/${projetoId}`);
}

// --- Faturas -----------------------------------------------------------------

/** Prazo de pagamento por omissão, quando não é indicado outro. */
const PRAZO_PAGAMENTO_DIAS = 30;

export async function criarFatura(fd: FormData) {
  const projetoId = numero(fd, "projeto_id") || null;
  const clienteId =
    numero(fd, "cliente_id") ||
    (projetoId
      ? ((await primeiro<{ cliente_id: number | null }>(
          "SELECT cliente_id FROM projetos WHERE id=?",
          projetoId,
        ))?.cliente_id ?? null)
      : null);
  const emitida = texto(fd, "emitida_em");
  await executa(
    `INSERT INTO faturas (projeto_id, cliente_id, descricao, tipo, valor, estado, emitida_em, vence_em)
     VALUES (?,?,?,?,?,?,?,?)`,
    projetoId,
    clienteId,
    texto(fd, "descricao") ?? "Fatura",
    texto(fd, "tipo") ?? "Adjudicação",
    numero(fd, "valor"),
    texto(fd, "estado") ?? "Pendente",
    emitida,
    // Sem prazo indicado, 30 dias a contar da emissão: sem data de vencimento
    // não há maneira de a fatura aparecer como vencida.
    texto(fd, "vence_em") ?? (emitida ? somarDias(emitida, PRAZO_PAGAMENTO_DIAS) : null),
  );
  refrescar("/", "/faturas", projetoId ? `/projetos/${projetoId}` : "/faturas");
}

export async function alternarPagamento(fd: FormData) {
  const id = numero(fd, "id");
  const f = await primeiro<{ estado: string; projeto_id: number | null }>(
    "SELECT estado, projeto_id FROM faturas WHERE id=?",
    id,
  );
  if (!f) return;
  if (f.estado === "Paga") {
    await executa("UPDATE faturas SET estado='Pendente', paga_em=NULL WHERE id=?", id);
  } else {
    await executa(`UPDATE faturas SET estado='Paga', paga_em=${HOJE} WHERE id=?`, id);
  }
  refrescar("/", "/faturas", f.projeto_id ? `/projetos/${f.projeto_id}` : "/faturas");
}

/** §4.8 — emitir uma fatura que estava só planeada, com prazo de pagamento. */
export async function emitirFatura(fd: FormData) {
  const id = numero(fd, "id");
  const emitida = texto(fd, "emitida_em") ?? hoje();
  const f = await primeiro<{ projeto_id: number | null }>("SELECT projeto_id FROM faturas WHERE id=?", id);
  await executa(
    "UPDATE faturas SET emitida_em=?, vence_em=?, estado='Pendente' WHERE id=?",
    emitida,
    texto(fd, "vence_em") ?? somarDias(emitida, numero(fd, "prazo") || PRAZO_PAGAMENTO_DIAS),
    id,
  );
  refrescar("/", "/faturas", f?.projeto_id ? `/projetos/${f.projeto_id}` : "/faturas");
}

export async function apagarFatura(fd: FormData) {
  const id = numero(fd, "id");
  const f = await primeiro<{ projeto_id: number | null }>("SELECT projeto_id FROM faturas WHERE id=?", id);
  await executa("DELETE FROM faturas WHERE id=?", id);
  refrescar("/", "/faturas", f?.projeto_id ? `/projetos/${f.projeto_id}` : "/faturas");
}

// --- Manutenção --------------------------------------------------------------

export async function guardarManutencao(fd: FormData) {
  const id = numero(fd, "id");
  const ciclo = texto(fd, "ciclo") ?? "Mensal";
  const inicio = texto(fd, "inicio");
  const campos = [
    numero(fd, "cliente_id") || null,
    numero(fd, "projeto_id") || null,
    texto(fd, "plano") ?? "basic",
    numero(fd, "valor_mensal"),
    texto(fd, "estado") ?? "Ativo",
    inicio,
    ciclo,
    texto(fd, "renovacao") ?? proximaRenovacao(inicio, ciclo),
    texto(fd, "fim"),
    texto(fd, "notas"),
  ];
  if (id) {
    await executa(
      `UPDATE manutencoes SET cliente_id=?, projeto_id=?, plano=?, valor_mensal=?, estado=?,
        inicio=?, ciclo=?, renovacao=?, fim=?, notas=? WHERE id=?`,
      ...campos,
      id,
    );
  } else {
    await executa(
      `INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio, ciclo,
        renovacao, fim, notas)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ...campos,
    );
  }
  refrescar("/", "/manutencao", "/clientes");
}

export async function apagarManutencao(fd: FormData) {
  await executa("DELETE FROM manutencoes WHERE id=?", numero(fd, "id"));
  refrescar("/", "/manutencao");
}

// --- Identidade / logótipo ---------------------------------------------------

const TIPOS_LOGO = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];

/** Guarda o logótipo na base de dados, para funcionar em alojamento sem disco. */
export async function guardarLogotipo(fd: FormData) {
  const ficheiro = fd.get("ficheiro");
  if (!(ficheiro instanceof File) || ficheiro.size === 0) return;
  if (ficheiro.size > 3 * 1024 * 1024) return;
  if (!TIPOS_LOGO.includes(ficheiro.type)) return;

  const chave = CHAVE[String(fd.get("variante")) === "escuro" ? "escuro" : "claro"];
  const dados = Buffer.from(await ficheiro.arrayBuffer());

  await executa(
    `INSERT INTO ficheiros (chave, tipo, dados, atualizado_em) VALUES (?,?,?,${AGORA})
     ON CONFLICT(chave) DO UPDATE
       SET tipo=excluded.tipo, dados=excluded.dados, atualizado_em=excluded.atualizado_em`,
    chave,
    ficheiro.type,
    dados,
  );
  revalidatePath("/", "layout");
}

export async function removerLogotipo(fd: FormData) {
  const chave = CHAVE[String(fd.get("variante")) === "escuro" ? "escuro" : "claro"];
  await executa("DELETE FROM ficheiros WHERE chave = ?", chave);
  revalidatePath("/", "layout");
}
