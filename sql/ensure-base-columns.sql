-- Execute este SQL no Supabase SQL Editor para garantir as colunas base nas tabelas de negócios.
-- Necessário quando a migration add-campos-personalizados.sql não foi aplicada ou
-- quando crm_negocios_atacado não tem a coluna campos_personalizados.

-- 1. Garante campos_personalizados em ambas as tabelas
ALTER TABLE crm_negocios_varejo  ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT '{}';
ALTER TABLE crm_negocios_atacado ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT '{}';

-- 2. Cria (ou recria) a função que o backend chama automaticamente no PUT de negócios
CREATE OR REPLACE FUNCTION crm_ensure_base_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE 'ALTER TABLE crm_negocios_varejo  ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT ''{}''';
  EXECUTE 'ALTER TABLE crm_negocios_atacado ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT ''{}''';
END;
$$;

-- Verificação: deve mostrar a coluna em ambas as tabelas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('crm_negocios_varejo', 'crm_negocios_atacado')
  AND column_name = 'campos_personalizados'
ORDER BY table_name;
