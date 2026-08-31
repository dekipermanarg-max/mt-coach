-- MT Coach shared database schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.master_mt (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branch_id uuid references public.branches(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(name, branch_id)
);

create table if not exists public.master_rombel (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branch_id uuid references public.branches(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(name, branch_id)
);

create table if not exists public.master_mapel (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_planning (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  planning_date date not null,
  mt_id uuid references public.master_mt(id) on delete set null,
  rombel_id uuid references public.master_rombel(id) on delete set null,
  mapel_id uuid references public.master_mapel(id) on delete set null,
  jenis_sesi text not null check (jenis_sesi in ('KBM', 'Klinik PR', 'Trial Class')),
  auvi_tv boolean not null default false,
  ld boolean not null default false,
  status text not null default 'Draft' check (status in ('Draft', 'Finalized')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_planning_branch_date on public.weekly_planning(branch_id, planning_date);
create index if not exists idx_mt_branch on public.master_mt(branch_id);
create index if not exists idx_rombel_branch on public.master_rombel(branch_id);

-- Public read/write is intentionally enabled for the prototype so the static
-- GitHub Pages app can use the Supabase anon key. Tighten these policies when
-- authentication/roles are added.
alter table public.branches enable row level security;
alter table public.master_mt enable row level security;
alter table public.master_rombel enable row level security;
alter table public.master_mapel enable row level security;
alter table public.weekly_planning enable row level security;

drop policy if exists "public read branches" on public.branches;
create policy "public read branches" on public.branches for select using (true);
drop policy if exists "public write branches" on public.branches;
create policy "public write branches" on public.branches for all using (true) with check (true);

drop policy if exists "public read mt" on public.master_mt;
create policy "public read mt" on public.master_mt for select using (true);
drop policy if exists "public write mt" on public.master_mt;
create policy "public write mt" on public.master_mt for all using (true) with check (true);

drop policy if exists "public read rombel" on public.master_rombel;
create policy "public read rombel" on public.master_rombel for select using (true);
drop policy if exists "public write rombel" on public.master_rombel;
create policy "public write rombel" on public.master_rombel for all using (true) with check (true);

drop policy if exists "public read mapel" on public.master_mapel;
create policy "public read mapel" on public.master_mapel for select using (true);
drop policy if exists "public write mapel" on public.master_mapel;
create policy "public write mapel" on public.master_mapel for all using (true) with check (true);

drop policy if exists "public read planning" on public.weekly_planning;
create policy "public read planning" on public.weekly_planning for select using (true);
drop policy if exists "public write planning" on public.weekly_planning;
create policy "public write planning" on public.weekly_planning for all using (true) with check (true);

-- Fixed session types used by Weekly Planning:
-- KBM, Klinik PR, Trial Class
