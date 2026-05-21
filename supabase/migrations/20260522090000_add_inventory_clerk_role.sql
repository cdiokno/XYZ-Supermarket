alter table app_private.accounts
drop constraint if exists accounts_role_check;

alter table app_private.accounts
add constraint accounts_role_check
check (role in ('admin', 'cashier', 'inventory_clerk'));

drop function if exists public.create_cashier_account(text, text, text);
drop function if exists app_private.create_cashier_account(text, text, text);

create or replace function app_private.create_app_account(
  p_admin_username text,
  p_name text,
  p_username text,
  p_password text,
  p_role text
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
  admin_username text := lower(trim(coalesce(p_admin_username, '')));
  trimmed_name text := trim(coalesce(p_name, ''));
  normalized_username text := lower(trim(coalesce(p_username, '')));
  normalized_role text := lower(trim(coalesce(p_role, '')));
  acting_account app_private.accounts%rowtype;
  created_account app_private.accounts%rowtype;
begin
  if admin_username = '' then
    raise exception 'No active session.';
  end if;

  select * into acting_account
  from app_private.accounts as account
  where lower(account.username) = admin_username;

  if not found or acting_account.role <> 'admin' then
    raise exception 'Only administrators can create accounts.';
  end if;

  if trimmed_name = '' or normalized_username = '' or coalesce(p_password, '') = '' then
    raise exception 'Complete all account fields.';
  end if;

  if normalized_role not in ('admin', 'cashier', 'inventory_clerk') then
    raise exception 'Select a valid account role.';
  end if;

  if exists (
    select 1
    from app_private.accounts as account
    where lower(account.username) = normalized_username
  ) then
    raise exception 'Username already exists.';
  end if;

  if exists (
    select 1
    from app_private.accounts as account
    where lower(account.name) = lower(trimmed_name)
  ) then
    raise exception 'Staff name already has an account.';
  end if;

  if normalized_role = 'cashier' then
    insert into public.cashiers(name)
    values (trimmed_name)
    on conflict on constraint cashiers_pkey do nothing;
  end if;

  insert into app_private.accounts as account (username, name, password_hash, role, profile_image)
  values (
    normalized_username,
    trimmed_name,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    normalized_role,
    ''
  )
  returning account.* into created_account;

  return query select * from app_private.public_account(created_account);
end;
$$;

create or replace function public.create_app_account(
  p_admin_username text,
  p_name text,
  p_username text,
  p_password text,
  p_role text
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
  from app_private.create_app_account(
    p_admin_username,
    p_name,
    p_username,
    p_password,
    p_role
  );
$$;

create or replace function app_private.delete_app_account(
  p_admin_username text,
  p_target_username text
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
  admin_username text := lower(trim(coalesce(p_admin_username, '')));
  target_username text := lower(trim(coalesce(p_target_username, '')));
  acting_account app_private.accounts%rowtype;
  deleted_account app_private.accounts%rowtype;
begin
  if admin_username = '' then
    raise exception 'No active session.';
  end if;

  if target_username = '' then
    raise exception 'Select an account to delete.';
  end if;

  if admin_username = target_username then
    raise exception 'You cannot delete your own account.';
  end if;

  select * into acting_account
  from app_private.accounts as account
  where lower(account.username) = admin_username;

  if not found then
    raise exception 'No active session.';
  end if;

  if acting_account.role <> 'admin' then
    raise exception 'Only administrators can delete accounts.';
  end if;

  delete from app_private.accounts as account
  where lower(account.username) = target_username
  returning account.* into deleted_account;

  if not found then
    raise exception 'Account not found.';
  end if;

  return query select * from app_private.public_account(deleted_account);
end;
$$;

grant execute on function app_private.create_app_account(text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_app_account(text, text, text, text, text) to anon, authenticated;
grant execute on function app_private.delete_app_account(text, text) to anon, authenticated;
grant execute on function public.delete_app_account(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
