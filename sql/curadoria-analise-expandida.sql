-- ============================================================
-- Curadoria — adiciona campos para análise editorial expandida
-- e tempo estimado de leitura. Idempotente.
-- Rode no SQL Editor do Supabase APÓS curadoria-noticias.sql.
-- ============================================================

alter table public.noticias_pendentes
  add column if not exists analise        text,
  add column if not exists tempo_leitura  integer;

alter table public.noticias_publicadas
  add column if not exists analise        text,
  add column if not exists tempo_leitura  integer;

comment on column public.noticias_pendentes.analise
  is 'Análise editorial expandida (5-8 frases) gerada pela IA com números-chave, contexto e ângulo para cliente institucional. Mostrada na UI da curadoria para decisão.';

comment on column public.noticias_pendentes.tempo_leitura
  is 'Tempo estimado de leitura da matéria original em minutos.';
