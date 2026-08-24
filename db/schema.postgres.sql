CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  empresa TEXT NOT NULL,
  nif TEXT,
  contacto_nome TEXT,
  contacto_cargo TEXT,
  email TEXT,
  telefone TEXT,
  website TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  empresa TEXT NOT NULL,
  contacto_nome TEXT,
  email TEXT,
  telefone TEXT,
  origem TEXT,
  fase TEXT NOT NULL DEFAULT 'Novo Lead',
  tipo_solucao TEXT,
  orcamento_indicado TEXT,
  valor_estimado DOUBLE PRECISION DEFAULT 0,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (now()::text),
  atualizado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  dados TEXT NOT NULL DEFAULT '{}',
  atualizado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS analises (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  titulo TEXT,
  inputs TEXT NOT NULL,
  preco_minimo DOUBLE PRECISION NOT NULL,
  preco_recomendado DOUBLE PRECISION NOT NULL,
  preco_premium DOUBLE PRECISION NOT NULL,
  mensalidade DOUBLE PRECISION NOT NULL,
  plano_manutencao TEXT,
  horas_estimadas DOUBLE PRECISION,
  valor_hora DOUBLE PRECISION,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS propostas (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  analise_id INTEGER REFERENCES analises(id) ON DELETE SET NULL,
  nivel TEXT NOT NULL,
  valor DOUBLE PRECISION NOT NULL,
  mensalidade DOUBLE PRECISION DEFAULT 0,
  validade_dias INTEGER DEFAULT 30,
  estado TEXT NOT NULL DEFAULT 'Rascunho',
  ambito TEXT,
  exclusoes TEXT,
  rondas_alteracoes INTEGER DEFAULT 2,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS projetos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  pacote TEXT,
  estado TEXT NOT NULL DEFAULT 'Kick-off',
  preco DOUBLE PRECISION NOT NULL DEFAULT 0,
  custos_externos DOUBLE PRECISION NOT NULL DEFAULT 0,
  horas_estimadas DOUBLE PRECISION NOT NULL DEFAULT 0,
  horas_reais DOUBLE PRECISION NOT NULL DEFAULT 0,
  inicio TEXT,
  entrega_prevista TEXT,
  checklist TEXT NOT NULL DEFAULT '[]',
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS faturas (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Adjudicação',
  valor DOUBLE PRECISION NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendente',
  emitida_em TEXT,
  paga_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS manutencoes (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
  plano TEXT NOT NULL DEFAULT 'basic',
  valor_mensal DOUBLE PRECISION NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Ativo',
  inicio TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS tarefas (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Aberta',
  prazo TEXT,
  criado_em TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS ficheiros (
  chave TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  dados BYTEA NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (now()::text)
);
