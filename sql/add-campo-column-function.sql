-- Função que cria uma coluna individual por campo personalizado
-- em ambas as tabelas de negócios. Usar IF NOT EXISTS garante idempotência.
-- Execute este SQL no Supabase antes de criar o primeiro campo personalizado.

CREATE OR REPLACE FUNCTION crm_add_campo_column(p_campo_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_campo_id NOT LIKE 'campo\_%' ESCAPE '\' THEN
    RAISE EXCEPTION 'campo_id inválido: deve começar com "campo_"';
  END IF;

  EXECUTE format(
    'ALTER TABLE crm_negocios_varejo  ADD COLUMN IF NOT EXISTS %I text',
    p_campo_id
  );
  EXECUTE format(
    'ALTER TABLE crm_negocios_atacado ADD COLUMN IF NOT EXISTS %I text',
    p_campo_id
  );
END;
$$;
