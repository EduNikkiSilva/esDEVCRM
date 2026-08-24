"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AGORA, HOJE, executa, insere, primeiro } from "@/lib/db";
import { PLANOS_PAGAMENTO } from "@/lib/dominio";
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
    `INSERT INTO leads (empresa, contacto_nome, email, telefone, origem, fase, tipo_solucao,
                        orcamento_indicado, valor_estimado, notas)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    texto(fd, "empresa") ?? "Sem nome",
    texto(fd, "contacto_nome"),
    texto(fd, "email"),
    texto(fd, "telefone"),
    texto(fd, "origem"),
    texto(fd, "fase") ?? "Novo Lead",
    texto(fd, "tipo_solucao"),
    texto(fd, "orcamento_indicado"),
    numero(fd, "valor_estimado"),
    texto(fd, "notas"),
  );
  refrescar("/", "/leads");
  redirect(`/leads/${res.lastInsertRowid}`);
}

export async function atualizarLead(fd: FormData) {
  const id = numero(fd, "id");
  await executa(
    `UPDATE leads SET empresa=?, contacto_nome=?, email=?, telefone=?, origem=?, fase=?,
       tipo_solucao=?, orcamento_indicado=?, valor_estimado=?, notas=?,
       atualizado_em=${AGORA} WHERE id=?`,
    texto(fd, "empresa") ?? "Sem nome",
    texto(fd, "contacto_nome"),
    texto(fd, "email"),
    texto(fd, "telefone"),
    texto(fd, "origem"),
    texto(fd, "fase") ?? "Novo Lead",
    texto(fd, "tipo_solucao"),
    texto(fd, "orcamento_indicado"),
    numero(fd, "valor_estimado"),
    texto(fd, "notas"),
    id,
  );
  refrescar("/", "/leads", `/leads/${id}`);
}

export async function mudarFaseLead(id: number, fase: string) {
  await executa(`UPDATE leads SET fase=?, atualizado_em=${AGORA} WHERE id=?`, fase, id);
  refrescar("/", "/leads", `/leads/${id}`);
}

export async function apagarLead(fd: FormData) {
  await executa("DELETE FROM leads WHERE id=?", numero(fd, "id"));
  refrescar("/", "/leads");
  redirect("/leads");
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

export async function criarProposta(fd: FormData) {
  const leadId = numero(fd, "lead_id");
  await executa(
    `INSERT INTO propostas (lead_id, analise_id, nivel, valor, mensalidade, validade_dias,
                            estado, ambito, exclusoes, rondas_alteracoes)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    leadId,
    numero(fd, "analise_id") || null,
    texto(fd, "nivel") ?? "BUSINESS",
    numero(fd, "valor"),
    numero(fd, "mensalidade"),
    numero(fd, "validade_dias") || 30,
    texto(fd, "estado") ?? "Rascunho",
    texto(fd, "ambito"),
    texto(fd, "exclusoes"),
    numero(fd, "rondas_alteracoes") || 2,
  );
  refrescar(`/leads/${leadId}`, "/propostas");
}

export async function mudarEstadoProposta(fd: FormData) {
  const id = numero(fd, "id");
  const estado = texto(fd, "estado") ?? "Rascunho";
  await executa("UPDATE propostas SET estado=? WHERE id=?", estado, id);
  const p = await primeiro<{ lead_id: number; valor: number }>(
    "SELECT lead_id, valor FROM propostas WHERE id=?",
    id,
  );
  if (p) {
    const fase =
      estado === "Enviada" ? "Proposta enviada" : estado === "Aceite" ? "Aceite" : null;
    if (fase) {
      await executa(
        `UPDATE leads SET fase=?, valor_estimado=?, atualizado_em=${AGORA} WHERE id=?`,
        fase,
        p.valor,
        p.lead_id,
      );
    }
    refrescar("/", "/leads", `/leads/${p.lead_id}`, "/propostas");
  }
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
    await executa(
      "INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio) VALUES (?,?,?,?,'Ativo',?)",
      clienteId,
      projetoId,
      texto(fd, "plano_manutencao") ?? "basic",
      mensalidade,
      texto(fd, "entrega_prevista"),
    );
  }

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
  await executa(
    "INSERT INTO faturas (projeto_id, cliente_id, descricao, tipo, valor, estado, emitida_em) VALUES (?,?,?,?,?,?,?)",
    projetoId,
    clienteId,
    texto(fd, "descricao") ?? "Fatura",
    texto(fd, "tipo") ?? "Adjudicação",
    numero(fd, "valor"),
    texto(fd, "estado") ?? "Pendente",
    texto(fd, "emitida_em"),
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

export async function apagarFatura(fd: FormData) {
  const id = numero(fd, "id");
  const f = await primeiro<{ projeto_id: number | null }>("SELECT projeto_id FROM faturas WHERE id=?", id);
  await executa("DELETE FROM faturas WHERE id=?", id);
  refrescar("/", "/faturas", f?.projeto_id ? `/projetos/${f.projeto_id}` : "/faturas");
}

// --- Manutenção --------------------------------------------------------------

export async function guardarManutencao(fd: FormData) {
  const id = numero(fd, "id");
  const campos = [
    numero(fd, "cliente_id") || null,
    numero(fd, "projeto_id") || null,
    texto(fd, "plano") ?? "basic",
    numero(fd, "valor_mensal"),
    texto(fd, "estado") ?? "Ativo",
    texto(fd, "inicio"),
    texto(fd, "notas"),
  ];
  if (id) {
    await executa(
      `UPDATE manutencoes SET cliente_id=?, projeto_id=?, plano=?, valor_mensal=?, estado=?,
        inicio=?, notas=? WHERE id=?`,
      ...campos,
      id,
    );
  } else {
    await executa(
      `INSERT INTO manutencoes (cliente_id, projeto_id, plano, valor_mensal, estado, inicio, notas)
       VALUES (?,?,?,?,?,?,?)`,
      ...campos,
    );
  }
  refrescar("/", "/manutencao");
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
