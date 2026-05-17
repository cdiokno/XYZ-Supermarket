alter table public.purchase_orders
add column if not exists received_qty integer not null default 0 check (received_qty >= 0);

alter table public.purchase_orders
drop constraint if exists purchase_orders_received_qty_not_more_than_qty;

alter table public.purchase_orders
add constraint purchase_orders_received_qty_not_more_than_qty
check (received_qty <= qty);

alter table public.purchase_orders
drop constraint if exists purchase_orders_status_check;

alter table public.purchase_orders
add constraint purchase_orders_status_check
check (status in ('Pending', 'Partially Received', 'Received'));

update public.purchase_orders
set received_qty = case
  when status = 'Received' then qty
  else received_qty
end;

update public.purchase_orders
set status = case
  when received_qty = 0 then 'Pending'
  when received_qty >= qty then 'Received'
  else 'Partially Received'
end;

create or replace function public.receive_purchase_order(p_po_id text, p_received_qty integer)
returns public.purchase_orders
language plpgsql
set search_path = public
as $$
declare
  po_row public.purchase_orders%rowtype;
  updated_po public.purchase_orders%rowtype;
  receipt_qty integer;
  next_received_qty integer;
begin
  select * into po_row
  from public.purchase_orders
  where id = p_po_id
  for update;

  if not found then
    raise exception 'Purchase order % was not found', p_po_id;
  end if;

  if po_row.received_qty >= po_row.qty then
    return po_row;
  end if;

  receipt_qty := coalesce(p_received_qty, po_row.qty - po_row.received_qty);

  if receipt_qty <= 0 then
    raise exception 'Received quantity must be greater than zero';
  end if;

  if receipt_qty > (po_row.qty - po_row.received_qty) then
    raise exception 'Cannot receive % units; only % remain for %',
      receipt_qty,
      po_row.qty - po_row.received_qty,
      po_row.product_name;
  end if;

  next_received_qty := po_row.received_qty + receipt_qty;

  update public.products
  set stock = stock + receipt_qty
  where id = po_row.product_id;

  update public.purchase_orders
  set
    received_qty = next_received_qty,
    status = case
      when next_received_qty = 0 then 'Pending'
      when next_received_qty >= qty then 'Received'
      else 'Partially Received'
    end
  where id = po_row.id
  returning * into updated_po;

  return updated_po;
end;
$$;

create or replace function public.receive_purchase_order(p_po_id text)
returns public.purchase_orders
language sql
set search_path = ''
as $$
  select public.receive_purchase_order(p_po_id, null);
$$;

create or replace function public.undo_receive_purchase_order(p_po_id text, p_received_qty integer)
returns public.purchase_orders
language plpgsql
set search_path = public
as $$
declare
  po_row public.purchase_orders%rowtype;
  updated_po public.purchase_orders%rowtype;
  undo_qty integer;
  next_received_qty integer;
begin
  select * into po_row
  from public.purchase_orders
  where id = p_po_id
  for update;

  if not found then
    raise exception 'Purchase order % was not found', p_po_id;
  end if;

  if po_row.received_qty <= 0 then
    return po_row;
  end if;

  undo_qty := coalesce(p_received_qty, po_row.received_qty);

  if undo_qty <= 0 then
    raise exception 'Undo quantity must be greater than zero';
  end if;

  if undo_qty > po_row.received_qty then
    raise exception 'Cannot undo % units; only % were received for %',
      undo_qty,
      po_row.received_qty,
      po_row.product_name;
  end if;

  update public.products
  set stock = stock - undo_qty
  where id = po_row.product_id
    and stock >= undo_qty;

  if not found then
    raise exception 'Not enough stock to undo receipt for %', po_row.product_name;
  end if;

  next_received_qty := po_row.received_qty - undo_qty;

  update public.purchase_orders
  set
    received_qty = next_received_qty,
    status = case
      when next_received_qty = 0 then 'Pending'
      when next_received_qty >= qty then 'Received'
      else 'Partially Received'
    end
  where id = po_row.id
  returning * into updated_po;

  return updated_po;
end;
$$;

create or replace function public.undo_receive_purchase_order(p_po_id text)
returns public.purchase_orders
language sql
set search_path = ''
as $$
  select public.undo_receive_purchase_order(p_po_id, null);
$$;

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

  if deleted_po.received_qty > 0 then
    update public.products
    set stock = stock - deleted_po.received_qty
    where id = deleted_po.product_id
      and stock >= deleted_po.received_qty;

    if not found then
      raise exception 'Not enough stock to delete received purchase order for %', deleted_po.product_name;
    end if;
  end if;

  delete from public.purchase_orders
  where id = deleted_po.id;

  return deleted_po;
end;
$$;

grant execute on function public.receive_purchase_order(text) to anon, authenticated;
grant execute on function public.receive_purchase_order(text, integer) to anon, authenticated;
grant execute on function public.undo_receive_purchase_order(text) to anon, authenticated;
grant execute on function public.undo_receive_purchase_order(text, integer) to anon, authenticated;
grant execute on function app_private.delete_purchase_order(text) to anon, authenticated;

notify pgrst, 'reload schema';
