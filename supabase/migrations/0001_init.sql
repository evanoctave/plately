-- =============================================================================
-- 0001_init — Plately cloud sync schema
-- =============================================================================
-- One table per synced SQLite table. Every table mirrors its local columns and
-- adds three server-owned columns:
--   user_id    uuid  — owner; all access is scoped to it via RLS
--   updated_at bigint — epoch ms; the Last-Write-Wins key
--   deleted    bool  — tombstone flag (a deleted row is kept, not removed)
--
-- The primary key is (user_id, <local pk>) so two users can hold the same id.
-- Data columns are nullable on purpose: a tombstone upsert carries only the pk.
--
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

-- entries -------------------------------------------------------------------
create table if not exists public.entries (
  user_id    uuid    not null references auth.users (id) on delete cascade,
  id         text    not null,
  day        text,
  "createdAt" bigint,
  "foodId"   text,
  name       text,
  grams      double precision,
  "photoUri" text,
  source     text,
  calories   double precision,
  protein    double precision,
  carbs      double precision,
  fat        double precision,
  fiber      double precision,
  sugar      double precision,
  sodium     double precision,
  potassium  double precision,
  calcium    double precision,
  iron       double precision,
  magnesium  double precision,
  "vitaminA" double precision,
  "vitaminC" double precision,
  "vitaminD" double precision,
  water      double precision,
  updated_at bigint  not null,
  deleted    boolean not null default false,
  primary key (user_id, id)
);

-- weights -------------------------------------------------------------------
create table if not exists public.weights (
  user_id     uuid    not null references auth.users (id) on delete cascade,
  day         text    not null,
  kg          double precision,
  "createdAt" bigint,
  updated_at  bigint  not null,
  deleted     boolean not null default false,
  primary key (user_id, day)
);

-- custom_foods --------------------------------------------------------------
create table if not exists public.custom_foods (
  user_id        uuid    not null references auth.users (id) on delete cascade,
  id             text    not null,
  name           text,
  category       text,
  "servingGrams" double precision,
  "servingLabel" text,
  "createdAt"    bigint,
  calories       double precision,
  protein        double precision,
  carbs          double precision,
  fat            double precision,
  fiber          double precision,
  sugar          double precision,
  sodium         double precision,
  potassium      double precision,
  calcium        double precision,
  iron           double precision,
  magnesium      double precision,
  "vitaminA"     double precision,
  "vitaminC"     double precision,
  "vitaminD"     double precision,
  water          double precision,
  updated_at     bigint  not null,
  deleted        boolean not null default false,
  primary key (user_id, id)
);

-- favorites -----------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid    not null references auth.users (id) on delete cascade,
  "foodId"    text    not null,
  "createdAt" bigint,
  updated_at  bigint  not null,
  deleted     boolean not null default false,
  primary key (user_id, "foodId")
);

-- fasting_sessions ----------------------------------------------------------
create table if not exists public.fasting_sessions (
  user_id       uuid    not null references auth.users (id) on delete cascade,
  id            text    not null,
  "startedAt"   bigint,
  "endedAt"     bigint,
  "targetHours" double precision,
  day           text,
  updated_at    bigint  not null,
  deleted       boolean not null default false,
  primary key (user_id, id)
);

-- plan_items ----------------------------------------------------------------
create table if not exists public.plan_items (
  user_id     uuid    not null references auth.users (id) on delete cascade,
  id          text    not null,
  day         text,
  "foodId"    text,
  name        text,
  grams       double precision,
  "createdAt" bigint,
  calories    double precision,
  protein     double precision,
  carbs       double precision,
  fat         double precision,
  fiber       double precision,
  sugar       double precision,
  sodium      double precision,
  potassium   double precision,
  calcium     double precision,
  iron        double precision,
  magnesium   double precision,
  "vitaminA"  double precision,
  "vitaminC"  double precision,
  "vitaminD"  double precision,
  water       double precision,
  updated_at  bigint  not null,
  deleted     boolean not null default false,
  primary key (user_id, id)
);

-- goal_phases ---------------------------------------------------------------
create table if not exists public.goal_phases (
  user_id     uuid    not null references auth.users (id) on delete cascade,
  id          text    not null,
  name        text,
  kind        text,
  calories    double precision,
  protein     double precision,
  carbs       double precision,
  fat         double precision,
  water       double precision,
  active      bigint,
  "createdAt" bigint,
  updated_at  bigint  not null,
  deleted     boolean not null default false,
  primary key (user_id, id)
);

-- Row-Level Security --------------------------------------------------------
-- Each user may only see and write their own rows. The same policy shape is
-- applied to every synced table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'entries', 'weights', 'custom_foods', 'favorites',
    'fasting_sessions', 'plan_items', 'goal_phases'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_owner', t
    );
    -- Pulls filter on updated_at; index keeps them cheap as history grows.
    execute format('create index if not exists %I on public.%I (user_id, updated_at);', t || '_user_updated', t);
  end loop;
end $$;
