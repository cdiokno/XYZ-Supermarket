create table if not exists public.receipt_returns (
  id text primary key default ('rr-' || md5(random()::text || clock_timestamp()::text)),
  sale_id text not null references public.sales(id) on delete restrict,
  date timestamptz not null default now(),
  cashier text not null references public.cashiers(name) on update cascade,
  type text not null check (type in ('cash_refund', 'replacement', 'store_credit')),
  returned_items jsonb not null default '[]'::jsonb check (jsonb_typeof(returned_items) = 'array'),
  replacement_items jsonb not null default '[]'::jsonb check (jsonb_typeof(replacement_items) = 'array'),
  returned_value numeric(12, 2) not null default 0 check (returned_value >= 0),
  replacement_value numeric(12, 2) not null default 0 check (replacement_value >= 0),
  refund_amount numeric(12, 2) not null default 0 check (refund_amount >= 0),
  additional_due numeric(12, 2) not null default 0 check (additional_due >= 0),
  store_credit_amount numeric(12, 2) not null default 0 check (store_credit_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists receipt_returns_sale_id_idx on public.receipt_returns(sale_id);
create index if not exists receipt_returns_date_idx on public.receipt_returns(date desc);
create index if not exists receipt_returns_type_idx on public.receipt_returns(type);

alter table public.receipt_returns enable row level security;

drop policy if exists "receipt_returns_public_select" on public.receipt_returns;
create policy "receipt_returns_public_select"
on public.receipt_returns for select
to anon, authenticated
using (true);

grant select on table public.receipt_returns to anon, authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.process_receipt_return(
  p_return_id text,
  p_sale_id text,
  p_cashier text,
  p_type text,
  p_returned_items jsonb,
  p_replacement_items jsonb default '[]'::jsonb,
  p_date timestamptz default now()
)
returns public.receipt_returns
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_row public.sales%rowtype;
  item record;
  sold_item public.sale_items%rowtype;
  product_row public.products%rowtype;
  inserted_return public.receipt_returns%rowtype;
  returned_items jsonb := '[]'::jsonb;
  replacement_items jsonb := '[]'::jsonb;
  returned_value numeric(12, 2) := 0;
  replacement_value numeric(12, 2) := 0;
  refund_amount numeric(12, 2) := 0;
  additional_due numeric(12, 2) := 0;
  store_credit_amount numeric(12, 2) := 0;
  previously_returned integer := 0;
  requested_in_this_return integer := 0;
begin
  if p_return_id is null or length(trim(p_return_id)) = 0 then
    raise exception 'Return id is required';
  end if;

  if p_sale_id is null or length(trim(p_sale_id)) = 0 then
    raise exception 'Receipt id is required';
  end if;

  if p_cashier is null or length(trim(p_cashier)) = 0 then
    raise exception 'Cashier is required';
  end if;

  if p_type not in ('cash_refund', 'replacement', 'store_credit') then
    raise exception 'Choose a valid return type';
  end if;

  if p_returned_items is null or jsonb_typeof(p_returned_items) <> 'array' then
    raise exception 'Returned items must be an array';
  end if;

  if jsonb_array_length(p_returned_items) = 0 then
    raise exception 'Select at least one returned item';
  end if;

  select * into sale_row
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Receipt % was not found', p_sale_id;
  end if;

  insert into public.cashiers(name)
  values (trim(p_cashier))
  on conflict (name) do nothing;

  for item in
    select *
    from jsonb_to_recordset(p_returned_items) as x(product_id text, qty integer)
  loop
    if item.product_id is null or length(trim(item.product_id)) = 0 or item.qty is null or item.qty <= 0 then
      raise exception 'Each returned item needs a valid product and quantity';
    end if;

    select * into sold_item
    from public.sale_items
    where sale_id = p_sale_id
      and product_id = item.product_id;

    if not found then
      raise exception 'Returned item % is not on receipt %', item.product_id, p_sale_id;
    end if;

    select coalesce(sum(returned_item.qty), 0) into previously_returned
    from public.receipt_returns rr
    cross join lateral jsonb_to_recordset(rr.returned_items) as returned_item("productId" text, qty integer)
    where rr.sale_id = p_sale_id
      and returned_item."productId" = item.product_id;

    select coalesce(sum(current_item.qty), 0) into requested_in_this_return
    from jsonb_to_recordset(returned_items) as current_item("productId" text, qty integer)
    where current_item."productId" = item.product_id;

    if item.qty + previously_returned + requested_in_this_return > sold_item.qty then
      raise exception 'Only % units of % can still be returned',
        greatest(sold_item.qty - previously_returned - requested_in_this_return, 0),
        sold_item.name;
    end if;

    returned_value := returned_value + (sold_item.price * item.qty);
    returned_items := returned_items || jsonb_build_array(
      jsonb_build_object(
        'productId', sold_item.product_id,
        'name', sold_item.name,
        'price', sold_item.price,
        'qty', item.qty
      )
    );
  end loop;

  if p_type = 'replacement' then
    if p_replacement_items is null or jsonb_typeof(p_replacement_items) <> 'array' or jsonb_array_length(p_replacement_items) = 0 then
      raise exception 'Select at least one replacement item';
    end if;

    for item in
      select *
      from jsonb_to_recordset(p_replacement_items) as x(product_id text, qty integer)
    loop
      if item.product_id is null or length(trim(item.product_id)) = 0 or item.qty is null or item.qty <= 0 then
        raise exception 'Each replacement item needs a valid product and quantity';
      end if;

      select * into product_row
      from public.products
      where id = item.product_id
        and deleted_at is null
      for update;

      if not found then
        raise exception 'Replacement item % was not found', item.product_id;
      end if;

      if product_row.stock < item.qty then
        raise exception 'Not enough stock for %', product_row.name;
      end if;

      update public.products
      set stock = product_row.stock - item.qty
      where id = product_row.id;

      replacement_value := replacement_value + (product_row.price * item.qty);
      replacement_items := replacement_items || jsonb_build_array(
        jsonb_build_object(
          'productId', product_row.id,
          'name', product_row.name,
          'price', product_row.price,
          'qty', item.qty
        )
      );
    end loop;

    refund_amount := greatest(returned_value - replacement_value, 0);
    additional_due := greatest(replacement_value - returned_value, 0);
  else
    if p_replacement_items is not null and jsonb_typeof(p_replacement_items) = 'array' and jsonb_array_length(p_replacement_items) > 0 then
      raise exception 'Replacement items are only allowed for replacement returns';
    end if;

    if p_type = 'cash_refund' then
      refund_amount := returned_value;
    else
      store_credit_amount := returned_value;
    end if;
  end if;

  insert into public.receipt_returns (
    id,
    sale_id,
    date,
    cashier,
    type,
    returned_items,
    replacement_items,
    returned_value,
    replacement_value,
    refund_amount,
    additional_due,
    store_credit_amount
  )
  values (
    trim(p_return_id),
    sale_row.id,
    coalesce(p_date, now()),
    trim(p_cashier),
    p_type,
    returned_items,
    replacement_items,
    returned_value,
    replacement_value,
    refund_amount,
    additional_due,
    store_credit_amount
  )
  returning * into inserted_return;

  return inserted_return;
end;
$$;

create or replace function public.process_receipt_return(
  p_return_id text,
  p_sale_id text,
  p_cashier text,
  p_type text,
  p_returned_items jsonb,
  p_replacement_items jsonb default '[]'::jsonb,
  p_date timestamptz default now()
)
returns public.receipt_returns
language sql
set search_path = ''
as $$
  select app_private.process_receipt_return(
    p_return_id,
    p_sale_id,
    p_cashier,
    p_type,
    p_returned_items,
    p_replacement_items,
    p_date
  );
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

  if exists (select 1 from public.receipt_returns where sale_id = p_sale_id) then
    raise exception 'Receipts with return history cannot be deleted';
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

grant execute on function public.process_receipt_return(text, text, text, text, jsonb, jsonb, timestamptz) to anon, authenticated;
grant execute on function app_private.process_receipt_return(text, text, text, text, jsonb, jsonb, timestamptz) to anon, authenticated;
grant execute on function public.delete_sale(text) to anon, authenticated;

notify pgrst, 'reload schema';
