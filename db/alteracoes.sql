-- Alterações a tabelas que já existem em bases de dados anteriores à V1.1.
--
-- Os schemas usam `CREATE TABLE IF NOT EXISTS`, logo uma tabela criada antes
-- destas colunas nunca as receberia. Este ficheiro corre depois do schema, uma
-- instrução por vez, e os erros de "coluna já existe" são ignorados de propósito
-- — é o que torna o ficheiro idempotente e válido nos dois motores.
--
-- Regras: apenas ADD COLUMN e CREATE INDEX. Nada destrutivo.

ALTER TABLE leads ADD COLUMN responsavel TEXT;
ALTER TABLE leads ADD COLUMN motivo_perda TEXT;

ALTER TABLE propostas ADD COLUMN numero TEXT;
ALTER TABLE propostas ADD COLUMN condicoes TEXT;
ALTER TABLE propostas ADD COLUMN observacoes TEXT;
ALTER TABLE propostas ADD COLUMN enviada_em TEXT;
ALTER TABLE propostas ADD COLUMN respondida_em TEXT;
ALTER TABLE propostas ADD COLUMN expira_em TEXT;

ALTER TABLE faturas ADD COLUMN vence_em TEXT;

ALTER TABLE manutencoes ADD COLUMN ciclo TEXT NOT NULL DEFAULT 'Mensal';
ALTER TABLE manutencoes ADD COLUMN renovacao TEXT;
ALTER TABLE manutencoes ADD COLUMN fim TEXT;

CREATE INDEX IF NOT EXISTS idx_atividades_lead ON atividades(lead_id);
CREATE INDEX IF NOT EXISTS idx_atividades_cliente ON atividades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atividades_projeto ON atividades(projeto_id);
CREATE INDEX IF NOT EXISTS idx_atividades_agenda ON atividades(concluida, data);
CREATE INDEX IF NOT EXISTS idx_contactos_cliente ON contactos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_cliente ON servicos_recorrentes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_renovacao ON servicos_recorrentes(estado, renovacao);
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON faturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_estado ON faturas(estado, vence_em);
CREATE INDEX IF NOT EXISTS idx_manutencoes_cliente ON manutencoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_propostas_lead ON propostas(lead_id);
CREATE INDEX IF NOT EXISTS idx_projetos_cliente ON projetos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_fase ON leads(fase);
