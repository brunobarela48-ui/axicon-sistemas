-- ============================================================
-- Newsletter — lista de assinantes + histórico de envios
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

create table if not exists public.newsletter_assinantes (
  id              uuid         primary key default gen_random_uuid(),
  email           text         not null,
  nome            text,
  ativo           boolean      not null default true,
  fonte           text,                       -- "manual" | "csv" | "form" | "import:..."
  consentimento   timestamptz  not null default now(),
  descadastro_em  timestamptz,
  descadastro_motivo text,
  unsubscribe_token text       not null default replace(gen_random_uuid()::text, '-', ''),
  ultimo_envio_em timestamptz,
  criado_em       timestamptz  not null default now(),
  criado_por      uuid         references public.usuarios(id)
);

create unique index if not exists newsletter_assinantes_email_idx
  on public.newsletter_assinantes (lower(email));

create unique index if not exists newsletter_assinantes_token_idx
  on public.newsletter_assinantes (unsubscribe_token);

create index if not exists newsletter_assinantes_ativo_idx
  on public.newsletter_assinantes (ativo);

comment on column public.newsletter_assinantes.unsubscribe_token
  is 'Token aleatório usado em URLs de descadastro. Único por assinante; regenerável.';

create table if not exists public.newsletter_envios (
  id              uuid         primary key default gen_random_uuid(),
  edicao_numero   integer      not null,
  assunto         text         not null,
  iniciado_em     timestamptz  not null default now(),
  finalizado_em   timestamptz,
  total_enviados  integer      not null default 0,
  total_falhas    integer      not null default 0,
  iniciado_por    uuid         references public.usuarios(id),
  payload_json    jsonb                                     -- snapshot do que foi enviado
);

create index if not exists newsletter_envios_iniciado_idx
  on public.newsletter_envios (iniciado_em desc);

-- RLS: tudo passa por supabaseAdmin nas rotas. Bloqueamos acesso anon.
alter table public.newsletter_assinantes enable row level security;
alter table public.newsletter_envios     enable row level security;
