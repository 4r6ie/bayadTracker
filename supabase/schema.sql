-- BayadTracker server schema for Supabase.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.
--
-- The phones keep their own SQLite copy and sync with these tables
-- (see src/sync/syncEngine.ts). Columns mirror the local schema, plus:
--   server_updated_at  set by the server on every write; phones pull
--                      "everything changed since my last pull" with it.
--   recorded_by        (payments) which account recorded the payment.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.amotan (
  id uuid primary key,
  title text not null,
  amount_cents integer not null check (amount_cents > 0),
  due_date date,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.amotan_payments (
  id uuid primary key,
  student_id uuid not null references public.students (id),
  amotan_id uuid not null references public.amotan (id),
  amount_cents integer not null check (amount_cents > 0),
  paid_date date not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  recorded_by uuid,
  server_updated_at timestamptz not null default now()
);

create index if not exists students_server_updated_at_idx
  on public.students (server_updated_at);
create index if not exists amotan_server_updated_at_idx
  on public.amotan (server_updated_at);
create index if not exists amotan_payments_server_updated_at_idx
  on public.amotan_payments (server_updated_at);
create index if not exists amotan_payments_student_idx
  on public.amotan_payments (student_id);
create index if not exists amotan_payments_amotan_idx
  on public.amotan_payments (amotan_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Latest edit wins, and every write gets a fresh server_updated_at.
-- If an older edit arrives after a newer one (a phone was offline), the
-- newer values are kept, but server_updated_at is still bumped so every
-- phone, including the one that sent the older edit, pulls the winner.
create or replace function public.sync_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    new := old;
  end if;
  new.server_updated_at := now();
  return new;
end;
$$;

-- recorded_by is set by the server from the signed-in account, never
-- trusted from the phone, and never changes after the insert.
create or replace function public.set_recorded_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.recorded_by := auth.uid();
  else
    new.recorded_by := old.recorded_by;
  end if;
  return new;
end;
$$;

drop trigger if exists students_sync_before_write on public.students;
create trigger students_sync_before_write
  before insert or update on public.students
  for each row execute function public.sync_before_write();

drop trigger if exists amotan_sync_before_write on public.amotan;
create trigger amotan_sync_before_write
  before insert or update on public.amotan
  for each row execute function public.sync_before_write();

drop trigger if exists amotan_payments_sync_before_write on public.amotan_payments;
create trigger amotan_payments_sync_before_write
  before insert or update on public.amotan_payments
  for each row execute function public.sync_before_write();

drop trigger if exists amotan_payments_set_recorded_by on public.amotan_payments;
create trigger amotan_payments_set_recorded_by
  before insert or update on public.amotan_payments
  for each row execute function public.set_recorded_by();

-- ---------------------------------------------------------------------------
-- Access: only the accounts listed in `members` can read or write.
-- ---------------------------------------------------------------------------

-- The allowlist. Even if someone signs up with the (public) app key, they
-- see nothing unless their user id is in here. No policies on this table,
-- so the app itself can never read or change it.
create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.members enable row level security;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members where user_id = (select auth.uid())
  );
$$;

alter table public.students enable row level security;
alter table public.amotan enable row level security;
alter table public.amotan_payments enable row level security;

-- No delete policies: the app only soft-deletes (deleted_at).
drop policy if exists "members can read" on public.students;
create policy "members can read" on public.students
  for select to authenticated using (public.is_member());
drop policy if exists "members can insert" on public.students;
create policy "members can insert" on public.students
  for insert to authenticated with check (public.is_member());
drop policy if exists "members can update" on public.students;
create policy "members can update" on public.students
  for update to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "members can read" on public.amotan;
create policy "members can read" on public.amotan
  for select to authenticated using (public.is_member());
drop policy if exists "members can insert" on public.amotan;
create policy "members can insert" on public.amotan
  for insert to authenticated with check (public.is_member());
drop policy if exists "members can update" on public.amotan;
create policy "members can update" on public.amotan
  for update to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "members can read" on public.amotan_payments;
create policy "members can read" on public.amotan_payments
  for select to authenticated using (public.is_member());
drop policy if exists "members can insert" on public.amotan_payments;
create policy "members can insert" on public.amotan_payments
  for insert to authenticated with check (public.is_member());
drop policy if exists "members can update" on public.amotan_payments;
create policy "members can update" on public.amotan_payments
  for update to authenticated using (public.is_member()) with check (public.is_member());

revoke all on public.students, public.amotan, public.amotan_payments, public.members
  from anon;
grant select, insert, update on public.students, public.amotan, public.amotan_payments
  to authenticated;

-- ---------------------------------------------------------------------------
-- After creating the two accounts (Authentication -> Users -> Add user),
-- put their emails below and run just this statement:
--
-- insert into public.members (user_id)
-- select id from auth.users
-- where email in ('mayor@example.com', 'secretary@example.com')
-- on conflict do nothing;
-- ---------------------------------------------------------------------------
