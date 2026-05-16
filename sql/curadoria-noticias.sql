-- ============================================================
-- Curadoria de notícias — pendentes + publicadas
--
-- Rode este SQL no editor SQL do Supabase (Project → SQL Editor).
-- Idempotente: pode rodar várias vezes sem quebrar nada.
-- ============================================================

create table if not exists public.noticias_pendentes (
  id           uuid         primary key default gen_random_uuid(),
  titulo       text         not null,
  resumo       text,
  fonte        text,
  link         text         not null,
  link_hash    text         not null,   -- hash do link para dedup
  data         timestamptz,
  tag          text,
  imagem       text,
  status       text         not null default 'pendente',  -- pendente | aprovado | rejeitado
  criado_em    timestamptz  not null default now(),
  decidido_em  timestamptz,
  decidido_por uuid         references public.usuarios(id)
);

create unique index if not exists noticias_pendentes_link_hash_idx
  on public.noticias_pendentes(link_hash);

create index if not exists noticias_pendentes_status_idx
  on public.noticias_pendentes(status, criado_em desc);

create table if not exists public.noticias_publicadas (
  id           uuid         primary key default gen_random_uuid(),
  pendente_id  uuid         references public.noticias_pendentes(id) on delete set null,
  titulo       text         not null,
  resumo       text,
  fonte        text,
  link         text         not null,
  data         timestamptz,
  tag          text,
  imagem       text,
  destaque     boolean      not null default false,
  publicado_em timestamptz  not null default now(),
  publicado_por uuid        references public.usuarios(id),
  ordem        integer      not null default 0
);

create index if not exists noticias_publicadas_ordem_idx
  on public.noticias_publicadas(publicado_em desc);

-- RLS: bloqueamos client-side, leitura/escrita só via service_role (server)
alter table public.noticias_pendentes  enable row level security;
alter table public.noticias_publicadas enable row level security;

-- Política de leitura PÚBLICA de noticias_publicadas (o site público consome via /api/noticias).
-- Mantemos via SDK server-side (supabaseAdmin) então não precisamos abrir RLS para anon.
-- Caso queira ler direto do client público, descomente:
-- create policy "public read noticias_publicadas"
--   on public.noticias_publicadas for select
--   using (true);
