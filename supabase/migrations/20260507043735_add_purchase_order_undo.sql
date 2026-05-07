create or replace function public.undo_receive_purchase_order(p_po_id text)
returns public.purchase_orders
language plpgsql
set search_path = public
as $$
declare
  po_row public.purchase_orders%rowtype;
  updated_po public.purchase_orders%rowtype;
begin
  select * into po_row
  from public.purchase_orders
  where id = p_po_id
  for update;

  if not found then
    raise exception 'Purchase order % was not found', p_po_id;
  end if;

  if po_row.status = 'Pending' then
    return po_row;
  end if;

  update public.products
  set stock = stock - po_row.qty
  where id = po_row.product_id
    and stock >= po_row.qty;

  if not found then
    raise exception 'Not enough stock to undo receipt for %', po_row.product_name;
  end if;

  update public.purchase_orders
  set status = 'Pending'
  where id = po_row.id
  returning * into updated_po;

  return updated_po;
end;
$$;

grant execute on function public.undo_receive_purchase_order(text) to anon, authenticated;
