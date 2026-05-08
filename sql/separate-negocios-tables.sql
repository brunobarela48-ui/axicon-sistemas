-- Cole este SQL inteiro no Supabase SQL Editor e execute

-- 1. Cria tabela varejo (schema idêntico ao crm_negocios, sem coluna "area")
CREATE TABLE IF NOT EXISTS crm_negocios_varejo (
  id            bigint PRIMARY KEY,
  empresa_id    text,
  titulo        text,
  valor         numeric DEFAULT 0,
  etapa         text,
  produto       text,
  probabilidade integer DEFAULT 20,
  descricao     text,
  contato_id    bigint,
  consultor_id  bigint,
  data_criacao  text,
  campos_extras text,
  bitrix_id     text,
  importado_de  text,
  atualizado_em text
);

-- 2. Cria tabela atacado (mesmo schema)
CREATE TABLE IF NOT EXISTS crm_negocios_atacado (
  id            bigint PRIMARY KEY,
  empresa_id    text,
  titulo        text,
  valor         numeric DEFAULT 0,
  etapa         text,
  produto       text,
  probabilidade integer DEFAULT 20,
  descricao     text,
  contato_id    bigint,
  consultor_id  bigint,
  data_criacao  text,
  campos_extras text,
  bitrix_id     text,
  importado_de  text,
  atualizado_em text
);

-- 3. Desabilita RLS
ALTER TABLE crm_negocios_varejo  DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_negocios_atacado DISABLE ROW LEVEL SECURITY;

-- 4. Migra dados de atacado (area dentro de campos_extras como JSON)
INSERT INTO crm_negocios_atacado
  (id, empresa_id, titulo, valor, etapa, produto, probabilidade, descricao,
   contato_id, consultor_id, data_criacao, campos_extras, bitrix_id, importado_de, atualizado_em)
SELECT
  id, empresa_id, titulo, valor, etapa, produto, probabilidade, descricao,
  contato_id, consultor_id, data_criacao,
  campos_extras::text,
  bitrix_id, importado_de, atualizado_em
FROM crm_negocios
WHERE campos_extras IS NOT NULL
  AND campos_extras::text NOT IN ('null', '')
  AND campos_extras::text LIKE '%"area":"atacado"%'
ON CONFLICT (id) DO NOTHING;

-- 5. Migra dados de varejo (tudo que não foi para atacado)
INSERT INTO crm_negocios_varejo
  (id, empresa_id, titulo, valor, etapa, produto, probabilidade, descricao,
   contato_id, consultor_id, data_criacao, campos_extras, bitrix_id, importado_de, atualizado_em)
SELECT
  id, empresa_id, titulo, valor, etapa, produto, probabilidade, descricao,
  contato_id, consultor_id, data_criacao,
  campos_extras::text,
  bitrix_id, importado_de, atualizado_em
FROM crm_negocios
WHERE id NOT IN (SELECT id FROM crm_negocios_atacado)
ON CONFLICT (id) DO NOTHING;

-- Conferência: deve mostrar contagens de cada tabela
SELECT 'crm_negocios (original)' AS tabela, COUNT(*) FROM crm_negocios
UNION ALL
SELECT 'crm_negocios_varejo',  COUNT(*) FROM crm_negocios_varejo
UNION ALL
SELECT 'crm_negocios_atacado', COUNT(*) FROM crm_negocios_atacado;
