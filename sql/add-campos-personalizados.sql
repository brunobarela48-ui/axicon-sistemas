-- Adiciona coluna campos_personalizados (JSONB) nas tabelas de negócios
-- e migra os valores de campos customizados que estavam misturados em campos_extras
-- (campos_extras é tipo JSONB no banco)

-- 1. Adiciona a coluna em ambas as tabelas
ALTER TABLE crm_negocios_varejo
  ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT '{}';

ALTER TABLE crm_negocios_atacado
  ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT '{}';

-- 2. Normaliza valores não-objeto para NULL
--    (escalares como "varejo", null JSON, etc. não podem ser processados como objeto)
UPDATE crm_negocios_varejo
SET campos_extras = NULL
WHERE campos_extras IS NOT NULL
  AND jsonb_typeof(campos_extras) <> 'object';

UPDATE crm_negocios_atacado
SET campos_extras = NULL
WHERE campos_extras IS NOT NULL
  AND jsonb_typeof(campos_extras) <> 'object';

-- 3. Migra campos personalizados (tudo exceto 'area') para a nova coluna — varejo
UPDATE crm_negocios_varejo
SET campos_personalizados = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(campos_extras)
  WHERE key <> 'area'
)
WHERE campos_extras IS NOT NULL
  AND campos_extras <> '{}'::jsonb
  AND campos_extras - 'area' <> '{}'::jsonb;

-- 3b. Migra campos personalizados — atacado
UPDATE crm_negocios_atacado
SET campos_personalizados = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(campos_extras)
  WHERE key <> 'area'
)
WHERE campos_extras IS NOT NULL
  AND campos_extras <> '{}'::jsonb
  AND campos_extras - 'area' <> '{}'::jsonb;

-- 4. Limpa campos_extras deixando só {area} — varejo
UPDATE crm_negocios_varejo
SET campos_extras = jsonb_build_object('area', campos_extras->>'area')
WHERE campos_extras IS NOT NULL;

-- 4b. Limpa campos_extras deixando só {area} — atacado
UPDATE crm_negocios_atacado
SET campos_extras = jsonb_build_object('area', campos_extras->>'area')
WHERE campos_extras IS NOT NULL;

-- Verificação
SELECT 'crm_negocios_varejo' AS tabela,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE campos_personalizados <> '{}') AS com_campos_personalizados
FROM crm_negocios_varejo
UNION ALL
SELECT 'crm_negocios_atacado',
       COUNT(*),
       COUNT(*) FILTER (WHERE campos_personalizados <> '{}')
FROM crm_negocios_atacado;
