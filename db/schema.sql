CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa TEXT NOT NULL,
  nif TEXT,
  contacto_nome TEXT,
  contacto_cargo TEXT,
  email TEXT,
  telefone TEXT,
  website TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  empresa TEXT NOT NULL,
  contacto_nome TEXT,
  email TEXT,
  telefone TEXT,
  origem TEXT,
  fase TEXT NOT NULL DEFAULT 'Novo Lead',
  tipo_solucao TEXT,
  orcamento_indicado TEXT,
  valor_estimado REAL DEFAULT 0,
  responsavel TEXT,
  motivo_perda TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS briefings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  dados TEXT NOT NULL DEFAULT '{}',
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  titulo TEXT,
  inputs TEXT NOT NULL,
  preco_minimo REAL NOT NULL,
  preco_recomendado REAL NOT NULL,
  preco_premium REAL NOT NULL,
  mensalidade REAL NOT NULL,
  plano_manutencao TEXT,
  horas_estimadas REAL,
  valor_hora REAL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS propostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  analise_id INTEGER REFERENCES analises(id) ON DELETE SET NULL,
  numero TEXT,
  nivel TEXT NOT NULL,
  valor REAL NOT NULL,
  mensalidade REAL DEFAULT 0,
  validade_dias INTEGER DEFAULT 30,
  estado TEXT NOT NULL DEFAULT 'Rascunho',
  ambito TEXT,
  exclusoes TEXT,
  condicoes TEXT,
  observacoes TEXT,
  rondas_alteracoes INTEGER DEFAULT 2,
  enviada_em TEXT,
  respondida_em TEXT,
  expira_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projetos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  pacote TEXT,
  estado TEXT NOT NULL DEFAULT 'Kick-off',
  preco REAL NOT NULL DEFAULT 0,
  custos_externos REAL NOT NULL DEFAULT 0,
  horas_estimadas REAL NOT NULL DEFAULT 0,
  horas_reais REAL NOT NULL DEFAULT 0,
  inicio TEXT,
  entrega_prevista TEXT,
  checklist TEXT NOT NULL DEFAULT '[]',
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Adjudicação',
  valor REAL NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendente',
  emitida_em TEXT,
  vence_em TEXT,
  paga_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS manutencoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
  plano TEXT NOT NULL DEFAULT 'basic',
  valor_mensal REAL NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Ativo',
  inicio TEXT,
  ciclo TEXT NOT NULL DEFAULT 'Mensal',
  renovacao TEXT,
  fim TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tarefas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Aberta',
  prazo TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ficheiros (
  chave TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  dados BLOB NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Registo de entradas, saídas e tentativas recusadas (timeout / headers de segurança).
CREATE TABLE IF NOT EXISTS acessos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  resultado TEXT NOT NULL,
  ip TEXT,
  agente TEXT,
  quando TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Histórico de contacto e próximas ações. É a entidade central da V1.1: liga-se
-- opcionalmente a lead, cliente e projeto, para a mesma timeline servir os três.
CREATE TABLE IF NOT EXISTS atividades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'Nota',
  titulo TEXT NOT NULL,
  descricao TEXT,
  data TEXT NOT NULL DEFAULT (date('now')),
  hora TEXT,
  concluida INTEGER NOT NULL DEFAULT 0,
  concluida_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pessoas dentro da empresa cliente. Os campos contacto_* de `clientes` continuam
-- a existir por compatibilidade e são migrados para cá progressivamente.
CREATE TABLE IF NOT EXISTS contactos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  email TEXT,
  telefone TEXT,
  principal INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Estrutura mínima de contratos (V1.1 prepara, V1.2 usa a fundo).
CREATE TABLE IF NOT EXISTS contratos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  proposta_id INTEGER REFERENCES propostas(id) ON DELETE SET NULL,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendente',
  data TEXT,
  ficheiro TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Serviços que geram receita recorrente: domínio, hosting, email, SEO, suporte.
CREATE TABLE IF NOT EXISTS servicos_recorrentes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'Manutenção',
  descricao TEXT,
  fornecedor TEXT,
  custo REAL NOT NULL DEFAULT 0,
  preco REAL NOT NULL DEFAULT 0,
  periodicidade TEXT NOT NULL DEFAULT 'Mensal',
  inicio TEXT,
  renovacao TEXT,
  estado TEXT NOT NULL DEFAULT 'Ativo',
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
