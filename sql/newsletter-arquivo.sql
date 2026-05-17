-- ============================================================
-- Newsletter — arquivo de edições enviadas
-- Salva snapshot do HTML/texto renderizado para histórico e
-- futuro "Leia online". Idempotente.
-- ============================================================

alter table public.newsletter_envios
  add column if not exists html_snapshot text,
  add column if not exists text_snapshot text;

comment on column public.newsletter_envios.html_snapshot
  is 'HTML completo renderizado no momento do envio. Permite reapresentar a edição mesmo se as notícias-fonte mudarem depois.';
