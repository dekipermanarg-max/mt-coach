-- Production security migration for MT Coach.
-- Applied to Supabase project yvthxrkvqlbeqrxfymyt.
-- This file documents the database-side authorization layer used by the app.

alter table public.app_users add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;

create or replace function public.current_app_user_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.app_users where auth_user_id = auth.uid() and active = true limit 1;
$$;

create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.app_users where auth_user_id = auth.uid() and active = true limit 1;
$$;

create or replace function public.has_branch_access(p_branch_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case when public.current_app_role() in ('SUPERADMIN','ATASAN') then true
    else exists (select 1 from public.user_branch_access uba where uba.user_id = public.current_app_user_id() and uba.branch_id = p_branch_id)
  end;
$$;

create or replace function public.can_write_data()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.current_app_role() in ('SUPERADMIN','ATASAN','MTC');
$$;

create or replace function public.can_manage_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.current_app_role() = 'SUPERADMIN';
$$;

-- Keep the exact policy definitions from the applied migration in sync with the database.
-- Do not restore any policy that grants public/anon read or write access to operational tables.
