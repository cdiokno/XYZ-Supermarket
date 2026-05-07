alter table public.products
add column if not exists deleted_at timestamptz;

create index if not exists products_deleted_at_idx on public.products(deleted_at);

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.delete_product(p_product_id text)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_product public.products%rowtype;
begin
  update public.products
  set deleted_at = now()
  where id = p_product_id
    and deleted_at is null
  returning * into deleted_product;

  if not found then
    raise exception 'Product % was not found', p_product_id;
  end if;

  return deleted_product;
end;
$$;

create or replace function public.delete_product(p_product_id text)
returns public.products
language sql
set search_path = ''
as $$
  select app_private.delete_product(p_product_id);
$$;

create or replace function app_private.delete_sale(p_sale_id text)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_sale public.sales%rowtype;
  item record;
begin
  select * into deleted_sale
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Sale % was not found', p_sale_id;
  end if;

  for item in
    select product_id, qty
    from public.sale_items
    where sale_id = p_sale_id
  loop
    update public.products
    set stock = stock + item.qty
    where id = item.product_id;
  end loop;

  delete from public.sales
  where id = p_sale_id;

  return deleted_sale;
end;
$$;

create or replace function public.delete_sale(p_sale_id text)
returns public.sales
language sql
set search_path = ''
as $$
  select app_private.delete_sale(p_sale_id);
$$;

grant execute on function app_private.delete_product(text) to anon, authenticated;
grant execute on function public.delete_product(text) to anon, authenticated;
grant execute on function app_private.delete_sale(text) to anon, authenticated;
grant execute on function public.delete_sale(text) to anon, authenticated;

notify pgrst, 'reload schema';
