create table if not exists public.products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null check (stock >= 0),
  reorder_level integer not null check (reorder_level >= 0),
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cashiers (
  name text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  date timestamptz not null default now(),
  cashier text not null references public.cashiers(name) on update cascade,
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  sale_id text not null references public.sales(id) on delete cascade,
  product_id text not null references public.products(id),
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  qty integer not null check (qty > 0),
  primary key (sale_id, product_id)
);

create table if not exists public.purchase_orders (
  id text primary key,
  date timestamptz not null default now(),
  supplier text not null,
  product_id text not null references public.products(id),
  product_name text not null,
  qty integer not null check (qty > 0),
  status text not null default 'Pending' check (status in ('Pending', 'Received')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_cashier_idx on public.sales(cashier);
create index if not exists sales_date_idx on public.sales(date desc);
create index if not exists sale_items_product_id_idx on public.sale_items(product_id);
create index if not exists purchase_orders_product_id_idx on public.purchase_orders(product_id);
create index if not exists purchase_orders_status_idx on public.purchase_orders(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.cashiers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchase_orders enable row level security;

drop policy if exists "products_public_select" on public.products;
create policy "products_public_select"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "products_public_insert" on public.products;
create policy "products_public_insert"
on public.products for insert
to anon, authenticated
with check (true);

drop policy if exists "products_public_update" on public.products;
create policy "products_public_update"
on public.products for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "cashiers_public_select" on public.cashiers;
create policy "cashiers_public_select"
on public.cashiers for select
to anon, authenticated
using (true);

drop policy if exists "cashiers_public_insert" on public.cashiers;
create policy "cashiers_public_insert"
on public.cashiers for insert
to anon, authenticated
with check (true);

drop policy if exists "sales_public_select" on public.sales;
create policy "sales_public_select"
on public.sales for select
to anon, authenticated
using (true);

drop policy if exists "sales_public_insert" on public.sales;
create policy "sales_public_insert"
on public.sales for insert
to anon, authenticated
with check (true);

drop policy if exists "sale_items_public_select" on public.sale_items;
create policy "sale_items_public_select"
on public.sale_items for select
to anon, authenticated
using (true);

drop policy if exists "sale_items_public_insert" on public.sale_items;
create policy "sale_items_public_insert"
on public.sale_items for insert
to anon, authenticated
with check (true);

drop policy if exists "purchase_orders_public_select" on public.purchase_orders;
create policy "purchase_orders_public_select"
on public.purchase_orders for select
to anon, authenticated
using (true);

drop policy if exists "purchase_orders_public_insert" on public.purchase_orders;
create policy "purchase_orders_public_insert"
on public.purchase_orders for insert
to anon, authenticated
with check (true);

drop policy if exists "purchase_orders_public_update" on public.purchase_orders;
create policy "purchase_orders_public_update"
on public.purchase_orders for update
to anon, authenticated
using (true)
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.products to anon, authenticated;
grant select, insert on table public.cashiers to anon, authenticated;
grant select, insert on table public.sales to anon, authenticated;
grant select, insert on table public.sale_items to anon, authenticated;
grant select, insert, update on table public.purchase_orders to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_insert" on storage.objects;
create policy "product_images_public_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'product-images');

drop policy if exists "product_images_public_update" on storage.objects;
create policy "product_images_public_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create or replace function public.checkout_sale(
  p_sale_id text,
  p_cashier text,
  p_items jsonb,
  p_date timestamptz default now()
)
returns public.sales
language plpgsql
set search_path = public
as $$
declare
  item record;
  product_row public.products%rowtype;
  sale_total numeric(12, 2) := 0;
  created_sale public.sales%rowtype;
begin
  if p_sale_id is null or length(trim(p_sale_id)) = 0 then
    raise exception 'Sale id is required';
  end if;

  if p_cashier is null or length(trim(p_cashier)) = 0 then
    raise exception 'Cashier is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Sale items must be an array';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Sale must include at least one item';
  end if;

  insert into public.cashiers(name)
  values (trim(p_cashier))
  on conflict (name) do nothing;

  for item in
    select *
    from jsonb_to_recordset(p_items) as x(product_id text, qty integer)
  loop
    if item.product_id is null or item.qty is null or item.qty <= 0 then
      raise exception 'Each sale item needs a valid product and quantity';
    end if;

    select * into product_row
    from public.products
    where id = item.product_id
    for update;

    if not found then
      raise exception 'Product % was not found', item.product_id;
    end if;

    if product_row.stock < item.qty then
      raise exception 'Not enough stock for %', product_row.name;
    end if;

    update public.products
    set stock = stock - item.qty
    where id = product_row.id;

    sale_total := sale_total + (product_row.price * item.qty);
  end loop;

  insert into public.sales(id, date, cashier, total)
  values (p_sale_id, coalesce(p_date, now()), trim(p_cashier), sale_total)
  returning * into created_sale;

  for item in
    select *
    from jsonb_to_recordset(p_items) as x(product_id text, qty integer)
  loop
    select * into product_row
    from public.products
    where id = item.product_id;

    insert into public.sale_items(sale_id, product_id, name, price, qty)
    values (p_sale_id, product_row.id, product_row.name, product_row.price, item.qty);
  end loop;

  return created_sale;
end;
$$;

create or replace function public.receive_purchase_order(p_po_id text)
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

  if po_row.status = 'Received' then
    return po_row;
  end if;

  update public.products
  set stock = stock + po_row.qty
  where id = po_row.product_id;

  update public.purchase_orders
  set status = 'Received'
  where id = po_row.id
  returning * into updated_po;

  return updated_po;
end;
$$;

grant execute on function public.checkout_sale(text, text, jsonb, timestamptz) to anon, authenticated;
grant execute on function public.receive_purchase_order(text) to anon, authenticated;
revoke execute on function public.rls_auto_enable() from public;

insert into public.products (id, sku, name, category, price, stock, reorder_level, image) values
  ('p1', 'GR-001', 'Jasmine Rice 5kg', 'Grocery', 320, 24, 10, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'),
  ('p2', 'GR-002', 'Brown Sugar 1kg', 'Grocery', 75, 8, 12, 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=400'),
  ('p3', 'GR-003', 'Cooking Oil 1L', 'Grocery', 110, 30, 15, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
  ('p4', 'GR-004', 'Instant Noodles', 'Grocery', 15, 120, 50, 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400'),
  ('p5', 'GR-005', 'Canned Sardines', 'Grocery', 28, 45, 20, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400'),
  ('p6', 'BV-001', 'Bottled Water 1.5L', 'Beverages', 25, 60, 30, 'https://images.unsplash.com/photo-1560847468-5eef0fa0d76e?w=400'),
  ('p7', 'BV-002', 'Cola 1.5L', 'Beverages', 65, 5, 15, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400'),
  ('p8', 'BV-003', 'Orange Juice 1L', 'Beverages', 95, 18, 10, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'),
  ('p9', 'BV-004', 'Coffee 3-in-1', 'Beverages', 12, 200, 80, 'https://images.unsplash.com/photo-1559525839-d9acfd02053c?w=400'),
  ('p10', 'PC-001', 'Bath Soap', 'Personal Care', 35, 40, 20, 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400'),
  ('p11', 'PC-002', 'Shampoo Sachet', 'Personal Care', 8, 150, 60, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400'),
  ('p12', 'PC-003', 'Toothpaste 150g', 'Personal Care', 95, 3, 10, 'https://images.unsplash.com/photo-1612538498488-22d72b9a4d96?w=400'),
  ('p13', 'PC-004', 'Laundry Detergent', 'Personal Care', 145, 22, 12, 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400')
on conflict (id) do nothing;

insert into public.cashiers (name) values
  ('Maria S.'),
  ('Juan D.'),
  ('Ana R.')
on conflict (name) do nothing;

insert into public.sales (id, date, cashier, total) values
  ('s1', now(), 'Maria S.', 540),
  ('s2', now(), 'Juan D.', 195),
  ('s3', now() - interval '1 day', 'Maria S.', 190),
  ('s4', now() - interval '2 days', 'Juan D.', 290),
  ('s5', now() - interval '3 days', 'Maria S.', 640),
  ('s6', now() - interval '4 days', 'Ana R.', 240),
  ('s7', now() - interval '5 days', 'Juan D.', 235),
  ('s8', now() - interval '6 days', 'Maria S.', 150)
on conflict (id) do nothing;

insert into public.sale_items (sale_id, product_id, name, price, qty) values
  ('s1', 'p1', 'Jasmine Rice 5kg', 320, 1),
  ('s1', 'p3', 'Cooking Oil 1L', 110, 2),
  ('s2', 'p7', 'Cola 1.5L', 65, 3),
  ('s3', 'p4', 'Instant Noodles', 15, 10),
  ('s3', 'p11', 'Shampoo Sachet', 8, 5),
  ('s4', 'p13', 'Laundry Detergent', 145, 2),
  ('s5', 'p1', 'Jasmine Rice 5kg', 320, 2),
  ('s6', 'p9', 'Coffee 3-in-1', 12, 20),
  ('s7', 'p10', 'Bath Soap', 35, 4),
  ('s7', 'p12', 'Toothpaste 150g', 95, 1),
  ('s8', 'p6', 'Bottled Water 1.5L', 25, 6)
on conflict (sale_id, product_id) do nothing;

insert into public.purchase_orders (id, date, supplier, product_id, product_name, qty, status) values
  ('po1', now() - interval '2 days', 'MegaFoods Distributors', 'p2', 'Brown Sugar 1kg', 50, 'Pending'),
  ('po2', now() - interval '5 days', 'AquaSupply Co.', 'p6', 'Bottled Water 1.5L', 100, 'Received'),
  ('po3', now() - interval '1 day', 'BevTrade Inc.', 'p7', 'Cola 1.5L', 60, 'Pending')
on conflict (id) do nothing;
