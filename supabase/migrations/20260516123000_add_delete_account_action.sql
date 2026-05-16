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
    and account.role = 'cashier'
  returning account.* into deleted_account;

  if not found then
    if exists (
      select 1
      from app_private.accounts as account
      where lower(account.username) = target_username
    ) then
      raise exception 'Only cashier accounts can be deleted.';
    end if;

    raise exception 'Account not found.';
  end if;

  return query select * from app_private.public_account(deleted_account);
end;
$$;

create or replace function public.delete_app_account(
  p_admin_username text,
  p_target_username text
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
  from app_private.delete_app_account(p_admin_username, p_target_username);
$$;

grant execute on function app_private.delete_app_account(text, text) to anon, authenticated;
grant execute on function public.delete_app_account(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
