-- ============================================================================
-- مستر بيتزا — المرحلة 3: الإدارة الخلفية (محاسبة + مخزون + موردون + مشتريات)
-- آمن وقابل للتكرار. لا يحذف أي بيانات.
-- يتطلّب تنفيذ 0003 أولاً (دوال is_admin / has_role).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ===== المحاسبة =====
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'عام',
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  vendor text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_expenses_date on public.expenses(spent_at desc);

create table if not exists public.revenues (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'أخرى',
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  order_id uuid references public.orders(id) on delete set null,
  received_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_revenues_date on public.revenues(received_at desc);

create table if not exists public.cashbox_transactions (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in','out')),
  amount numeric(12,2) not null check (amount >= 0),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  party text not null,
  kind text not null check (kind in ('receivable','payable')), -- لنا / علينا
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  due_date date,
  is_settled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ===== الموردون =====
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  contact_name text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ===== المخزون =====
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'وحدة',
  quantity numeric(12,2) not null default 0,
  min_quantity numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  direction text not null check (direction in ('in','out','adjust')),
  quantity numeric(12,2) not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_movements_item on public.stock_movements(item_id, created_at desc);

-- وصفة المنتج (لخصم المخزون تلقائياً عند البيع)
create table if not exists public.product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity numeric(12,2) not null default 0,
  unique (product_id, item_id)
);

-- ===== المشتريات =====
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','ordered','received','cancelled')),
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  received_at timestamptz
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references public.purchase_orders(id) on delete cascade,
  item_id uuid references public.inventory_items(id) on delete set null,
  name text not null,
  quantity numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);
create index if not exists idx_po_items_po on public.purchase_order_items(po_id);

-- ===== خصم المخزون تلقائياً عند البيع =====
create or replace function public.deduct_inventory_on_sale()
returns trigger language plpgsql security definer set search_path = public as $$
declare ing record;
begin
  if new.product_id is not null then
    for ing in select item_id, quantity from public.product_ingredients where product_id = new.product_id loop
      update public.inventory_items
        set quantity = quantity - (ing.quantity * new.quantity)
        where id = ing.item_id;
      insert into public.stock_movements (item_id, direction, quantity, reason)
        values (ing.item_id, 'out', ing.quantity * new.quantity, 'خصم تلقائي عند البيع');
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists trg_deduct_inventory on public.order_items;
create trigger trg_deduct_inventory after insert on public.order_items
  for each row execute function public.deduct_inventory_on_sale();

-- ===== RLS: قراءة للطاقم الإداري، كتابة للمالك/المدير/المشرف =====
do $$
declare t text;
begin
  foreach t in array array[
    'expenses','revenues','cashbox_transactions','debts','suppliers',
    'inventory_items','stock_movements','product_ingredients',
    'purchase_orders','purchase_order_items'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%1$s read" on public.%1$s;', t);
    execute format('create policy "%1$s read" on public.%1$s for select to authenticated using (public.is_admin());', t);
    execute format('drop policy if exists "%1$s manage" on public.%1$s;', t);
    execute format(
      'create policy "%1$s manage" on public.%1$s for all to authenticated using (public.has_role(array[''owner'',''manager'',''admin''])) with check (public.has_role(array[''owner'',''manager'',''admin'']));',
      t
    );
  end loop;
end $$;

-- ===== انتهى =====
