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
  from app_private.accounts as account
  where lower(account.username) = normalized_username;

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
    raise exception 'Cashier name already has an account.';
  end if;

  insert into public.cashiers(name)
  values (trimmed_name)
  on conflict on constraint cashiers_pkey do nothing;

  insert into app_private.accounts as account (username, name, password_hash, role, profile_image)
  values (
    normalized_username,
    trimmed_name,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    'cashier',
    ''
  )
  returning account.* into created_account;

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
  from app_private.accounts as account
  where lower(account.username) = current_username
  for update;

  if not found then
    raise exception 'Could not find your account.';
  end if;

  if exists (
    select 1
    from app_private.accounts as account
    where lower(account.username) = normalized_username
      and lower(account.username) <> current_username
  ) then
    raise exception 'Username already exists.';
  end if;

  if exists (
    select 1
    from app_private.accounts as account
    where lower(account.name) = lower(trimmed_name)
      and lower(account.username) <> current_username
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
    update public.cashiers as cashier
    set name = trimmed_name
    where cashier.name = account_row.name;

    if not found then
      insert into public.cashiers(name)
      values (trimmed_name)
      on conflict on constraint cashiers_pkey do nothing;
    end if;
  end if;

  update app_private.accounts as account
  set
    username = normalized_username,
    name = trimmed_name,
    profile_image = coalesce(p_profile_image, ''),
    password_hash = case
      when wants_password_change then extensions.crypt(normalized_new_password, extensions.gen_salt('bf'))
      else account.password_hash
    end
  where lower(account.username) = current_username
  returning account.* into updated_account;

  return query select * from app_private.public_account(updated_account);
end;
$$;

grant execute on function app_private.login_app_account(text, text) to anon, authenticated;
grant execute on function app_private.create_cashier_account(text, text, text) to anon, authenticated;
grant execute on function app_private.update_app_account(text, text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
