create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

drop policy if exists "cashiers_public_update" on public.cashiers;
create policy "cashiers_public_update"
on public.cashiers for update
to anon, authenticated
using (true)
with check (true);

grant select, insert, update on table public.cashiers to anon, authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create table if not exists app_private.accounts (
  username text primary key,
  name text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'cashier')),
  profile_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_private.accounts enable row level security;

drop trigger if exists accounts_set_updated_at on app_private.accounts;
create trigger accounts_set_updated_at
before update on app_private.accounts
for each row execute function public.set_updated_at();

insert into app_private.accounts (username, name, password_hash, role, profile_image)
values (
  'admin',
  'Administrator',
  extensions.crypt('admin123', extensions.gen_salt('bf')),
  'admin',
  ''
)
on conflict (username) do nothing;

create or replace function app_private.public_account(account_row app_private.accounts)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language sql
stable
set search_path = ''
as $$
  select
    (account_row).username,
    (account_row).name,
    (account_row).role,
    (account_row).profile_image;
$$;

create or replace function app_private.list_app_accounts()
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language sql
security definer
set search_path = ''
as $$
  select account.username, account.name, account.role, account.profile_image
  from app_private.accounts as account
  order by account.role, account.name;
$$;

create or replace function app_private.login_app_account(
  p_username text,
  p_password text
)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_username text := lower(trim(coalesce(p_username, '')));
  account_row app_private.accounts%rowtype;
begin
  if normalized_username = '' or coalesce(p_password, '') = '' then
    raise exception 'Enter username and password.';
  end if;

  select * into account_row
  from app_private.accounts
  where lower(accounts.username) = normalized_username;

  if not found or account_row.password_hash <> extensions.crypt(p_password, account_row.password_hash) then
    raise exception 'Invalid username or password.';
  end if;

  return query select * from app_private.public_account(account_row);
end;
$$;

create or replace function app_private.create_cashier_account(
  p_name text,
  p_username text,
  p_password text
)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  trimmed_name text := trim(coalesce(p_name, ''));
  normalized_username text := lower(trim(coalesce(p_username, '')));
  created_account app_private.accounts%rowtype;
begin
  if trimmed_name = '' or normalized_username = '' or coalesce(p_password, '') = '' then
    raise exception 'Complete all cashier account fields.';
  end if;

  if exists (
    select 1
    from app_private.accounts
    where lower(accounts.username) = normalized_username
  ) then
    raise exception 'Username already exists.';
  end if;

  if exists (
    select 1
    from app_private.accounts
    where lower(accounts.name) = lower(trimmed_name)
  ) then
    raise exception 'Cashier name already has an account.';
  end if;

  insert into public.cashiers(name)
  values (trimmed_name)
  on conflict (name) do nothing;

  insert into app_private.accounts (username, name, password_hash, role, profile_image)
  values (
    normalized_username,
    trimmed_name,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    'cashier',
    ''
  )
  returning * into created_account;

  return query select * from app_private.public_account(created_account);
end;
$$;

create or replace function app_private.update_app_account(
  p_current_username text,
  p_name text,
  p_username text,
  p_profile_image text default '',
  p_current_password text default null,
  p_new_password text default null
)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_username text := lower(trim(coalesce(p_current_username, '')));
  trimmed_name text := trim(coalesce(p_name, ''));
  normalized_username text := lower(trim(coalesce(p_username, '')));
  normalized_current_password text := trim(coalesce(p_current_password, ''));
  normalized_new_password text := trim(coalesce(p_new_password, ''));
  wants_password_change boolean := normalized_current_password <> '' or normalized_new_password <> '';
  account_row app_private.accounts%rowtype;
  updated_account app_private.accounts%rowtype;
begin
  if current_username = '' then
    raise exception 'No active session.';
  end if;

  if trimmed_name = '' or normalized_username = '' then
    raise exception 'Name and username are required.';
  end if;

  select * into account_row
  from app_private.accounts
  where lower(accounts.username) = current_username
  for update;

  if not found then
    raise exception 'Could not find your account.';
  end if;

  if exists (
    select 1
    from app_private.accounts
    where lower(accounts.username) = normalized_username
      and lower(accounts.username) <> current_username
  ) then
    raise exception 'Username already exists.';
  end if;

  if exists (
    select 1
    from app_private.accounts
    where lower(accounts.name) = lower(trimmed_name)
      and lower(accounts.username) <> current_username
  ) then
    raise exception 'Cashier name already has an account.';
  end if;

  if wants_password_change then
    if normalized_current_password = '' or normalized_new_password = '' then
      raise exception 'Enter current password and type the new password twice.';
    end if;

    if account_row.password_hash <> extensions.crypt(normalized_current_password, account_row.password_hash) then
      raise exception 'Current password is incorrect.';
    end if;
  end if;

  if account_row.role = 'cashier' and account_row.name <> trimmed_name then
    update public.cashiers
    set name = trimmed_name
    where name = account_row.name;

    if not found then
      insert into public.cashiers(name)
      values (trimmed_name)
      on conflict (name) do nothing;
    end if;
  end if;

  update app_private.accounts
  set
    username = normalized_username,
    name = trimmed_name,
    profile_image = coalesce(p_profile_image, ''),
    password_hash = case
      when wants_password_change then extensions.crypt(normalized_new_password, extensions.gen_salt('bf'))
      else password_hash
    end
  where lower(accounts.username) = current_username
  returning * into updated_account;

  return query select * from app_private.public_account(updated_account);
end;
$$;

create or replace function public.list_app_accounts()
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language sql
set search_path = ''
as $$
  select * from app_private.list_app_accounts();
$$;

create or replace function public.login_app_account(
  p_username text,
  p_password text
)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language sql
set search_path = ''
as $$
  select * from app_private.login_app_account(p_username, p_password);
$$;

create or replace function public.create_cashier_account(
  p_name text,
  p_username text,
  p_password text
)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language sql
set search_path = ''
as $$
  select * from app_private.create_cashier_account(p_name, p_username, p_password);
$$;

create or replace function public.update_app_account(
  p_current_username text,
  p_name text,
  p_username text,
  p_profile_image text default '',
  p_current_password text default null,
  p_new_password text default null
)
returns table (
  username text,
  name text,
  role text,
  profile_image text
)
language sql
set search_path = ''
as $$
  select *
  from app_private.update_app_account(
    p_current_username,
    p_name,
    p_username,
    p_profile_image,
    p_current_password,
    p_new_password
  );
$$;

grant execute on function app_private.list_app_accounts() to anon, authenticated;
grant execute on function app_private.login_app_account(text, text) to anon, authenticated;
grant execute on function app_private.create_cashier_account(text, text, text) to anon, authenticated;
grant execute on function app_private.update_app_account(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.list_app_accounts() to anon, authenticated;
grant execute on function public.login_app_account(text, text) to anon, authenticated;
grant execute on function public.create_cashier_account(text, text, text) to anon, authenticated;
grant execute on function public.update_app_account(text, text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
