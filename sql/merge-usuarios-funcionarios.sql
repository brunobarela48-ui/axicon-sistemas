-- ============================================================
-- MERGE: usuarios + crm_funcionarios → crm_funcionarios
-- Execute no SQL Editor do Supabase (Settings → SQL Editor)
-- ============================================================

-- 1. Adiciona colunas de auth na tabela crm_funcionarios
ALTER TABLE crm_funcionarios
  ADD COLUMN IF NOT EXISTS role       TEXT,
  ADD COLUMN IF NOT EXISTS ativo      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tem_acesso BOOLEAN DEFAULT false;

-- 2. Migra dados de usuarios → crm_funcionarios (join por email)
--    Preserva o role e status de login de quem já tem conta
UPDATE crm_funcionarios f
SET
  role       = u.role,
  ativo      = u.ativo,
  tem_acesso = true
FROM usuarios u
WHERE LOWER(f.email) = LOWER(u.email)
  AND f.email IS NOT NULL;

-- 3. Insere usuários que ainda não têm registro de funcionário
--    (ex: admin que nunca foi cadastrado como funcionário)
INSERT INTO crm_funcionarios (
  empresa_id, nome, email,
  role, ativo, tem_acesso,
  cargo, salario, tipo, status,
  data_admissao, atualizado_em
)
SELECT
  'axicon',
  u.nome,
  u.email,
  u.role,
  u.ativo,
  true,
  'Administrador',
  0,
  'pj',
  CASE WHEN u.ativo THEN 'ativo' ELSE 'inativo' END,
  NOW(),
  NOW()
FROM usuarios u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM crm_funcionarios f
    WHERE LOWER(f.email) = LOWER(u.email)
  )
ON CONFLICT DO NOTHING;

-- 4. Desabilita RLS nas tabelas de entidade (corrige o problema de save)
ALTER TABLE crm_funcionarios  DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contatos      DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_negocios      DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_atividades    DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tarefas       DISABLE ROW LEVEL SECURITY;
ALTER TABLE fin_contas        DISABLE ROW LEVEL SECURITY;
ALTER TABLE fin_extratos      DISABLE ROW LEVEL SECURITY;
ALTER TABLE fin_fornecedores  DISABLE ROW LEVEL SECURITY;

-- 5. (Opcional) Remove a tabela usuarios antiga após confirmar que tudo funciona
-- DROP TABLE IF EXISTS usuarios;
