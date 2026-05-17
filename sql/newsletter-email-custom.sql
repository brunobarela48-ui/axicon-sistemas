-- ============================================================
-- Newsletter — suporte a envios "custom" (HTML colado pela admin)
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================
--
-- A tabela newsletter_envios passa a comportar dois tipos:
--   tipo = 'daily'  → newsletter Áxicon Daily News (composer)
--   tipo = 'custom' → e-mail avulso disparado da aba "E-mail Custom"
--
-- edicao_numero deixa de ser obrigatório (custom não tem numeração serial;
-- continua obrigatório para 'daily' por validação na aplicação).

alter table public.newsletter_envios
  add column if not exists tipo text not null default 'daily';

alter table public.newsletter_envios
  alter column edicao_numero drop not null;

create index if not exists newsletter_envios_tipo_idx
  on public.newsletter_envios (tipo);

comment on column public.newsletter_envios.tipo
  is 'daily = newsletter padrão (composer). custom = HTML avulso colado em /curadoria/email-custom.';
