-- TACT Notes stores only setup metadata in Supabase. Markdown note contents
-- remain in each user's local vault and are never written to these tables.

create table public.tact_notes_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  local_folder_label text not null check (char_length(trim(local_folder_label)) between 1 and 255),
  git_provider text not null default 'github' check (git_provider in ('github')),
  git_repository text,
  encryption_mode text not null default 'pending' check (encryption_mode in ('pending', 'device_encrypted')),
  encryption_key_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.tact_notes_vaults enable row level security;

grant select, insert, update, delete on public.tact_notes_vaults to authenticated;

create policy "Users can read their own TACT Notes vault"
  on public.tact_notes_vaults for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own TACT Notes vault"
  on public.tact_notes_vaults for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own TACT Notes vault"
  on public.tact_notes_vaults for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own TACT Notes vault"
  on public.tact_notes_vaults for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.tact_notes_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google')),
  account_email text,
  scopes text[] not null default array['https://www.googleapis.com/auth/calendar.events.readonly'],
  status text not null default 'not_connected' check (status in ('not_connected', 'connected', 'revoked', 'error')),
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.tact_notes_calendar_connections enable row level security;

grant select, insert, update, delete on public.tact_notes_calendar_connections to authenticated;

create policy "Users can read their own TACT Notes calendar connections"
  on public.tact_notes_calendar_connections for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own TACT Notes calendar connections"
  on public.tact_notes_calendar_connections for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own TACT Notes calendar connections"
  on public.tact_notes_calendar_connections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own TACT Notes calendar connections"
  on public.tact_notes_calendar_connections for delete to authenticated
  using ((select auth.uid()) = user_id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.tact_notes_google_credentials (
  connection_id uuid primary key references public.tact_notes_calendar_connections(id) on delete cascade,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table private.tact_notes_google_credentials from public, anon, authenticated;
