-- ============================================================================
-- مستر بيتزا — المرحلة 1: حسابات العملاء + الولاء + المفضلة + كوبونات متقدمة
-- آمن وقابل للتكرار: add column if not exists / create table if not exists / drop policy if exists.
-- لا يحذف أي بيانات.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ===== 1) ملفات العملاء (مرتبطة بـ auth.users) =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  birthday date,
  points int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profile self select" on public.profiles;
create policy "profile self select" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile self upsert" on public.profiles;
create policy "profile self upsert" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- المدير يقرأ كل الملفات (لإحصائيات أكثر العملاء)
drop policy if exists "admin read profiles" on public.profiles;
create policy "admin read profiles" on public.profiles for select to authenticated using (public.is_admin());

-- إنشاء ملف تلقائياً عند التسجيل
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== 2) عناوين العملاء =====
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  city text not null,
  address text not null,
  landmark text,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on public.customer_addresses(user_id);
alter table public.customer_addresses enable row level security;
drop policy if exists "address self all" on public.customer_addresses;
create policy "address self all" on public.customer_addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 3) المفضلة =====
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists idx_favorites_user on public.favorites(user_id);
alter table public.favorites enable row level security;
drop policy if exists "favorite self all" on public.favorites;
create policy "favorite self all" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 4) سجل نقاط الولاء =====
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  delta int not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_points_user on public.point_transactions(user_id, created_at desc);
alter table public.point_transactions enable row level security;
drop policy if exists "points self select" on public.point_transactions;
create policy "points self select" on public.point_transactions for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin read points" on public.point_transactions;
create policy "admin read points" on public.point_transactions for select to authenticated using (public.is_admin());
-- الكتابة عبر service_role فقط (API)

-- ===== 5) ربط الطلبات بالعميل =====
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_orders_user on public.orders(user_id);

drop policy if exists "user reads own orders" on public.orders;
create policy "user reads own orders" on public.orders for select to authenticated using (user_id = auth.uid());

drop policy if exists "user reads own order items" on public.order_items;
create policy "user reads own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

-- منح نقاط الولاء تلقائياً عند إنشاء طلب مرتبط بعميل (كل 10,000 = نقطة)
create or replace function public.award_loyalty_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare pts int;
begin
  if new.user_id is not null then
    pts := floor(new.total / 10000);
    if pts > 0 then
      insert into public.point_transactions (user_id, order_id, delta, reason)
      values (new.user_id, new.id, pts, 'كسب نقاط من الطلب');
      update public.profiles set points = points + pts where id = new.user_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_award_points on public.orders;
create trigger trg_award_points after insert on public.orders
  for each row execute function public.award_loyalty_points();

-- ===== 6) عداد العروض (وقت بداية/نهاية الخصم) =====
alter table public.products add column if not exists offer_starts_at timestamptz;
alter table public.products add column if not exists offer_ends_at timestamptz;

-- ===== 7) كوبونات متقدمة =====
alter table public.coupons add column if not exists type text not null default 'percent';
do $$ begin
  alter table public.coupons add constraint coupons_type_check check (type in ('percent','fixed'));
exception when duplicate_object then null; end $$;
alter table public.coupons add column if not exists amount numeric(10,2) not null default 0;
alter table public.coupons add column if not exists usage_limit int;
alter table public.coupons add column if not exists per_user_limit int;
alter table public.coupons add column if not exists used_count int not null default 0;
alter table public.coupons add column if not exists starts_at timestamptz;
alter table public.coupons add column if not exists first_order_only boolean not null default false;
alter table public.coupons add column if not exists customers_only boolean not null default false;

-- سجل استخدام الكوبونات (لحدود الاستخدام لكل مستخدم)
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  code text,
  created_at timestamptz not null default now()
);
create index if not exists idx_redemptions_coupon on public.coupon_redemptions(coupon_id);
create index if not exists idx_redemptions_user on public.coupon_redemptions(user_id);
alter table public.coupon_redemptions enable row level security;
drop policy if exists "redemption self select" on public.coupon_redemptions;
create policy "redemption self select" on public.coupon_redemptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin all redemptions" on public.coupon_redemptions;
create policy "admin all redemptions" on public.coupon_redemptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===== انتهى =====
