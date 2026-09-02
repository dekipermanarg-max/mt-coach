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

-- Automatic audit history for every data mutation.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);
create index if not exists idx_audit_log_changed_at on public.audit_log(changed_at desc);
create index if not exists idx_audit_log_table_record on public.audit_log(table_name, record_id);

create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_log(table_name, record_id, action, new_data) values (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_log(table_name, record_id, action, old_data, new_data) values (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    return NEW;
  else
    insert into public.audit_log(table_name, record_id, action, old_data) values (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    return OLD;
  end if;
end;
$$;

drop trigger if exists audit_branches on public.branches;
create trigger audit_branches after insert or update or delete on public.branches for each row execute function public.audit_row_change();
drop trigger if exists audit_master_mt on public.master_mt;
create trigger audit_master_mt after insert or update or delete on public.master_mt for each row execute function public.audit_row_change();
drop trigger if exists audit_master_rombel on public.master_rombel;
create trigger audit_master_rombel after insert or update or delete on public.master_rombel for each row execute function public.audit_row_change();
drop trigger if exists audit_master_mapel on public.master_mapel;
create trigger audit_master_mapel after insert or update or delete on public.master_mapel for each row execute function public.audit_row_change();
drop trigger if exists audit_weekly_planning on public.weekly_planning;
create trigger audit_weekly_planning after insert or update or delete on public.weekly_planning for each row execute function public.audit_row_change();

alter table public.audit_log enable row level security;
drop policy if exists "public read audit" on public.audit_log;
create policy "public read audit" on public.audit_log for select using (true);

drop policy if exists "public insert audit" on public.audit_log;
create policy "public insert audit" on public.audit_log for insert with check (true);
