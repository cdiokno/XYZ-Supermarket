create table if not exists public.inventory_history (
  id text primary key default ('ih-' || md5(random()::text || clock_timestamp()::text)),
  date timestamptz not null default now(),
  product_id text not null,
  product_name text not null,
  sku text not null,
  source text not null check (source in ('manual', 'purchase_order')),
  action text not null check (
    action in (
      'product_created',
      'product_updated',
      'product_deleted',
      'po_received',
      'po_receipt_undone',
      'po_deleted'
    )
  ),
  quantity_delta integer,
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  changes jsonb not null default '[]'::jsonb,
  reference_type text not null check (reference_type in ('product', 'purchase_order')),
  reference_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_history_date_idx on public.inventory_history(date desc);
create index if not exists inventory_history_product_id_idx on public.inventory_history(product_id);
create index if not exists inventory_history_source_action_idx on public.inventory_history(source, action);

alter table public.inventory_history enable row level security;

drop policy if exists "inventory_history_public_select" on public.inventory_history;
create policy "inventory_history_public_select"
on public.inventory_history for select
to anon, authenticated
using (true);

drop policy if exists "inventory_history_public_insert" on public.inventory_history;
create policy "inventory_history_public_insert"
on public.inventory_history for insert
to anon, authenticated
with check (true);

grant select, insert on table public.inventory_history to anon, authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.append_inventory_change(
  p_changes jsonb,
  p_field text,
  p_label text,
  p_before jsonb,
  p_after jsonb
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_changes, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'field', p_field,
      'label', p_label,
      'before', p_before,
      'after', p_after
    )
  );
$$;

create or replace function app_private.insert_inventory_history(
  p_product_id text,
  p_product_name text,
  p_sku text,
  p_source text,
  p_action text,
  p_quantity_delta integer,
  p_stock_before integer,
  p_stock_after integer,
  p_changes jsonb,
  p_reference_type text,
  p_reference_id text
)
returns public.inventory_history
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_history public.inventory_history%rowtype;
begin
  insert into public.inventory_history (
    product_id,
    product_name,
    sku,
    source,
    action,
    quantity_delta,
    stock_before,
    stock_after,
    changes,
    reference_type,
    reference_id
  )
  values (
    p_product_id,
    p_product_name,
    p_sku,
    p_source,
    p_action,
    p_quantity_delta,
    p_stock_before,
    p_stock_after,
    coalesce(p_changes, '[]'::jsonb),
    p_reference_type,
    p_reference_id
  )
  returning * into inserted_history;

  return inserted_history;
end;
$$;

create or replace function public.upsert_product_with_history(
  p_product_id text,
  p_sku text,
  p_name text,
  p_category text,
  p_price numeric,
  p_stock integer,
  p_reorder_level integer,
  p_image text default null
)
returns public.products
language plpgsql
set search_path = public
as $$
declare
  old_product public.products%rowtype;
  saved_product public.products%rowtype;
  changes jsonb := '[]'::jsonb;
  quantity_delta integer;
  action_name text;
begin
  if p_product_id is null or length(trim(p_product_id)) = 0 then
    raise exception 'Product id is required';
  end if;

  if p_sku is null or length(trim(p_sku)) = 0 then
    raise exception 'SKU is required';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Product name is required';
  end if;

  if p_category is null or length(trim(p_category)) = 0 then
    raise exception 'Category is required';
  end if;

  if p_price is null or p_price < 0 then
    raise exception 'Price must be zero or greater';
  end if;

  if p_stock is null or p_stock < 0 then
    raise exception 'Stock must be zero or greater';
  end if;

  if p_reorder_level is null or p_reorder_level < 0 then
    raise exception 'Reorder level must be zero or greater';
  end if;

  select * into old_product
  from public.products
  where id = p_product_id
  for update;

  if found then
    update public.products
    set
      sku = trim(p_sku),
      name = trim(p_name),
      category = trim(p_category),
      price = p_price,
      stock = p_stock,
      reorder_level = p_reorder_level,
      image = nullif(trim(coalesce(p_image, '')), ''),
      deleted_at = null
    where id = p_product_id
    returning * into saved_product;

    action_name := 'product_updated';

    if old_product.sku is distinct from saved_product.sku then
      changes := app_private.append_inventory_change(changes, 'sku', 'SKU', to_jsonb(old_product.sku), to_jsonb(saved_product.sku));
    end if;
    if old_product.name is distinct from saved_product.name then
      changes := app_private.append_inventory_change(changes, 'name', 'Name', to_jsonb(old_product.name), to_jsonb(saved_product.name));
    end if;
    if old_product.category is distinct from saved_product.category then
      changes := app_private.append_inventory_change(changes, 'category', 'Category', to_jsonb(old_product.category), to_jsonb(saved_product.category));
    end if;
    if old_product.price is distinct from saved_product.price then
      changes := app_private.append_inventory_change(changes, 'price', 'Price', to_jsonb(old_product.price), to_jsonb(saved_product.price));
    end if;
    if old_product.stock is distinct from saved_product.stock then
      changes := app_private.append_inventory_change(changes, 'stock', 'Stock', to_jsonb(old_product.stock), to_jsonb(saved_product.stock));
    end if;
    if old_product.reorder_level is distinct from saved_product.reorder_level then
      changes := app_private.append_inventory_change(changes, 'reorderLevel', 'Reorder level', to_jsonb(old_product.reorder_level), to_jsonb(saved_product.reorder_level));
    end if;
    if old_product.image is distinct from saved_product.image then
      changes := app_private.append_inventory_change(changes, 'image', 'Photo', to_jsonb(old_product.image), to_jsonb(saved_product.image));
    end if;

    if changes = '[]'::jsonb then
      return saved_product;
    end if;
  else
    insert into public.products (id, sku, name, category, price, stock, reorder_level, image)
    values (
      p_product_id,
      trim(p_sku),
      trim(p_name),
      trim(p_category),
      p_price,
      p_stock,
      p_reorder_level,
      nullif(trim(coalesce(p_image, '')), '')
    )
    returning * into saved_product;

    action_name := 'product_created';
    changes := app_private.append_inventory_change(changes, 'sku', 'SKU', null, to_jsonb(saved_product.sku));
    changes := app_private.append_inventory_change(changes, 'name', 'Name', null, to_jsonb(saved_product.name));
    changes := app_private.append_inventory_change(changes, 'category', 'Category', null, to_jsonb(saved_product.category));
    changes := app_private.append_inventory_change(changes, 'price', 'Price', null, to_jsonb(saved_product.price));
    changes := app_private.append_inventory_change(changes, 'stock', 'Stock', to_jsonb(0), to_jsonb(saved_product.stock));
    changes := app_private.append_inventory_change(changes, 'reorderLevel', 'Reorder level', null, to_jsonb(saved_product.reorder_level));
    if saved_product.image is not null then
      changes := app_private.append_inventory_change(changes, 'image', 'Photo', null, to_jsonb(saved_product.image));
    end if;
  end if;

  quantity_delta := case
    when coalesce(old_product.stock, 0) is distinct from saved_product.stock then saved_product.stock - coalesce(old_product.stock, 0)
    else null
  end;

  perform app_private.insert_inventory_history(
    saved_product.id,
    saved_product.name,
    saved_product.sku,
    'manual',
    action_name,
    quantity_delta,
    coalesce(old_product.stock, 0),
    saved_product.stock,
    changes,
    'product',
    saved_product.id
  );

  return saved_product;
end;
$$;

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

  perform app_private.insert_inventory_history(
    deleted_product.id,
    deleted_product.name,
    deleted_product.sku,
    'manual',
    'product_deleted',
    null,
    deleted_product.stock,
    deleted_product.stock,
    '[]'::jsonb,
    'product',
    deleted_product.id
  );

  return deleted_product;
end;
$$;

create or replace function public.receive_purchase_order(p_po_id text, p_received_qty integer)
returns public.purchase_orders
language plpgsql
set search_path = public
as $$
declare
  po_row public.purchase_orders%rowtype;
  updated_po public.purchase_orders%rowtype;
  product_row public.products%rowtype;
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

  select * into product_row
  from public.products
  where id = po_row.product_id
  for update;

  if not found then
    raise exception 'Product % was not found', po_row.product_id;
  end if;

  next_received_qty := po_row.received_qty + receipt_qty;

  update public.products
  set stock = product_row.stock + receipt_qty
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

  perform app_private.insert_inventory_history(
    product_row.id,
    product_row.name,
    product_row.sku,
    'purchase_order',
    'po_received',
    receipt_qty,
    product_row.stock,
    product_row.stock + receipt_qty,
    '[]'::jsonb,
    'purchase_order',
    po_row.id
  );

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
  product_row public.products%rowtype;
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

  select * into product_row
  from public.products
  where id = po_row.product_id
  for update;

  if not found then
    raise exception 'Product % was not found', po_row.product_id;
  end if;

  if product_row.stock < undo_qty then
    raise exception 'Not enough stock to undo receipt for %', po_row.product_name;
  end if;

  update public.products
  set stock = product_row.stock - undo_qty
  where id = po_row.product_id;

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

  perform app_private.insert_inventory_history(
    product_row.id,
    product_row.name,
    product_row.sku,
    'purchase_order',
    'po_receipt_undone',
    -undo_qty,
    product_row.stock,
    product_row.stock - undo_qty,
    '[]'::jsonb,
    'purchase_order',
    po_row.id
  );

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
  product_row public.products%rowtype;
begin
  select * into deleted_po
  from public.purchase_orders
  where id = p_po_id
  for update;

  if not found then
    raise exception 'Purchase order % was not found', p_po_id;
  end if;

  if deleted_po.received_qty > 0 then
    select * into product_row
    from public.products
    where id = deleted_po.product_id
    for update;

    if not found then
      raise exception 'Product % was not found', deleted_po.product_id;
    end if;

    if product_row.stock < deleted_po.received_qty then
      raise exception 'Not enough stock to delete received purchase order for %', deleted_po.product_name;
    end if;

    update public.products
    set stock = product_row.stock - deleted_po.received_qty
    where id = deleted_po.product_id;

    perform app_private.insert_inventory_history(
      product_row.id,
      product_row.name,
      product_row.sku,
      'purchase_order',
      'po_deleted',
      -deleted_po.received_qty,
      product_row.stock,
      product_row.stock - deleted_po.received_qty,
      '[]'::jsonb,
      'purchase_order',
      deleted_po.id
    );
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

grant execute on function public.upsert_product_with_history(text, text, text, text, numeric, integer, integer, text) to anon, authenticated;
grant execute on function app_private.append_inventory_change(jsonb, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function app_private.insert_inventory_history(text, text, text, text, text, integer, integer, integer, jsonb, text, text) to anon, authenticated;
grant execute on function public.receive_purchase_order(text) to anon, authenticated;
grant execute on function public.receive_purchase_order(text, integer) to anon, authenticated;
grant execute on function public.undo_receive_purchase_order(text) to anon, authenticated;
grant execute on function public.undo_receive_purchase_order(text, integer) to anon, authenticated;
grant execute on function app_private.delete_product(text) to anon, authenticated;
grant execute on function public.delete_product(text) to anon, authenticated;
grant execute on function app_private.delete_purchase_order(text) to anon, authenticated;
grant execute on function public.delete_purchase_order(text) to anon, authenticated;

notify pgrst, 'reload schema';
