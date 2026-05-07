create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.delete_purchase_order(p_po_id text)
returns public.purchase_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_po public.purchase_orders%rowtype;
begin
  select * into deleted_po
  from public.purchase_orders
  where id = p_po_id
  for update;

  if not found then
    raise exception 'Purchase order % was not found', p_po_id;
  end if;

  if deleted_po.status = 'Received' then
    update public.products
    set stock = stock - deleted_po.qty
    where id = deleted_po.product_id
      and stock >= deleted_po.qty;

    if not found then
      raise exception 'Not enough stock to delete received purchase order for %', deleted_po.product_name;
    end if;
  end if;

  delete from public.purchase_orders
  where id = deleted_po.id;

  return deleted_po;
end;
$$;

create or replace function public.delete_purchase_order(p_po_id text)
returns public.purchase_orders
language sql
set search_path = ''
as $$
  select app_private.delete_purchase_order(p_po_id);
$$;

grant execute on function app_private.delete_purchase_order(text) to anon, authenticated;
grant execute on function public.delete_purchase_order(text) to anon, authenticated;

notify pgrst, 'reload schema';
