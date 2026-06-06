-- ============================================================================
-- مستر بيتزا | Mr Pizza — Database Schema (Supabase / PostgreSQL)
-- نفّذ هذا الملف في Supabase SQL Editor مرة واحدة لإنشاء كل شيء.
-- يتضمّن: الجداول، الأنواع، المحفّزات، سياسات RLS، التخزين، وبيانات أولية.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ===== الأنواع (Enums) =====
do $$ begin
  create type order_status as enum
    ('received','preparing','in_oven','ready','on_the_way','delivered','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_method as enum ('delivery','pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash','card');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid','awaiting_confirmation','paid');
exception when duplicate_object then null; end $$;
-- في حال كان النوع موجوداً مسبقاً بدون القيمة الجديدة
alter type payment_status add value if not exists 'awaiting_confirmation';

-- ===== دالة تحديث updated_at =====
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
-- المستخدمون (المدراء) — مرتبط بـ auth.users
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

-- دالة مساعدة: هل المستخدم الحالي مدير؟
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid());
$$;

-- ============================================================================
-- الأقسام
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- المنتجات
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  base_price numeric(10,2) not null check (base_price >= 0),
  discount_price numeric(10,2) check (discount_price >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_featured on public.products(is_featured) where is_featured;

-- ===== أحجام المنتج =====
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) not null default 0,
  is_default boolean not null default false,
  sort_order int not null default 0
);
create index if not exists idx_sizes_product on public.product_sizes(product_id);

-- ===== إضافات المنتج =====
create table if not exists public.product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  is_active boolean not null default true
);
create index if not exists idx_addons_product on public.product_addons(product_id);

-- ============================================================================
-- الكوبونات
-- ============================================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_percent int not null check (discount_percent between 1 and 100),
  max_discount numeric(10,2),
  min_order numeric(10,2) not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- البانرات / السلايدر
-- ============================================================================
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- إعدادات المطعم (صف واحد)
-- ============================================================================
create table if not exists public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'مستر بيتزا',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  city text not null default '',
  delivery_zones text[] not null default '{}',
  working_hours text not null default '',
  delivery_fee numeric(10,2) not null default 0,
  min_order numeric(10,2) not null default 0,
  is_open boolean not null default true,
  closed_message text default 'عذراً، المطعم مغلق حالياً. نعود قريباً!',
  map_url text,
  qr_payment_image_url text,
  sound_alerts boolean not null default true,
  latitude double precision,
  longitude double precision,
  facebook_url text,
  instagram_url text,
  tiktok_url text
);
-- أعمدة جديدة للتثبيتات القائمة
alter table public.restaurant_settings add column if not exists closed_message text default 'عذراً، المطعم مغلق حالياً. نعود قريباً!';
alter table public.restaurant_settings add column if not exists map_url text;
alter table public.restaurant_settings add column if not exists qr_payment_image_url text;
alter table public.restaurant_settings add column if not exists sound_alerts boolean not null default true;

-- ============================================================================
-- الطلبات
-- ============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  city text not null,
  address text,
  landmark text,
  latitude double precision,
  longitude double precision,
  delivery_method delivery_method not null default 'delivery',
  payment_method payment_method not null default 'cash',
  payment_status payment_status not null default 'unpaid',
  status order_status not null default 'received',
  notes text,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_code text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders add column if not exists reviewed_at timestamptz;
create index if not exists idx_orders_phone on public.orders(customer_phone);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function set_updated_at();

-- ===== عناصر الطلب =====
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size_name text,
  addons jsonb not null default '[]',
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null,
  notes text
);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ============================================================================
-- الفواتير (سجل لكل طلب)
-- ============================================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  invoice_number text not null unique,
  issued_at timestamptz not null default now(),
  total numeric(10,2) not null,
  payment_status payment_status not null default 'unpaid'
);

-- إنشاء فاتورة تلقائياً عند إنشاء طلب
create or replace function public.create_invoice_for_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.invoices (order_id, invoice_number, total, payment_status)
  values (new.id, 'INV-' || new.code, new.total, new.payment_status)
  on conflict (invoice_number) do nothing;
  return new;
end $$;

drop trigger if exists trg_order_invoice on public.orders;
create trigger trg_order_invoice after insert on public.orders
  for each row execute function public.create_invoice_for_order();

-- ============================================================================
-- صور المنتج (عدة صور لكل منتج)
-- ============================================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on public.product_images(product_id);

-- ============================================================================
-- تقييمات العملاء
-- ============================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (order_id)
);
create index if not exists idx_reviews_approved on public.reviews(is_approved, created_at desc);

-- ============================================================================
-- اشتراكات الإشعارات (Push)
-- ============================================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_code text,
  endpoint text unique,
  subscription jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- تفعيل RLS على كل الجداول
-- ============================================================================
alter table public.product_images enable row level security;
alter table public.reviews enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_addons enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.invoices enable row level security;

-- ===== سياسات القراءة العامة (المحتوى المعروض للزوار) =====
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);

drop policy if exists "public read sizes" on public.product_sizes;
create policy "public read sizes" on public.product_sizes for select using (true);

drop policy if exists "public read addons" on public.product_addons;
create policy "public read addons" on public.product_addons for select using (true);

drop policy if exists "public read coupons" on public.coupons;
create policy "public read coupons" on public.coupons for select using (is_active);

drop policy if exists "public read banners" on public.banners;
create policy "public read banners" on public.banners for select using (is_active);

drop policy if exists "public read settings" on public.restaurant_settings;
create policy "public read settings" on public.restaurant_settings for select using (true);

drop policy if exists "public read product_images" on public.product_images;
create policy "public read product_images" on public.product_images for select using (true);

drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews for select using (is_approved);

drop policy if exists "admin read push" on public.push_subscriptions;
create policy "admin read push" on public.push_subscriptions for select to authenticated using (public.is_admin());

-- ===== سياسات المدير (تحكّم كامل) =====
-- ملاحظة: إنشاء الطلبات يتم عبر service_role في API (يتجاوز RLS).
do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','product_sizes','product_addons',
    'coupons','banners','restaurant_settings','orders','order_items','invoices','users',
    'product_images','reviews'
  ] loop
    execute format('drop policy if exists "admin all %1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin all %1$s" on public.%1$s for all to authenticated using (public.is_admin()) with check (public.is_admin());',
      t
    );
  end loop;
end $$;

-- المستخدم يقرأ سجلّه الخاص
drop policy if exists "user reads self" on public.users;
create policy "user reads self" on public.users for select to authenticated using (id = auth.uid());

-- ============================================================================
-- التخزين: حاوية عامة لصور المنيو والأقسام والبانرات
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do nothing;

drop policy if exists "public read menu bucket" on storage.objects;
create policy "public read menu bucket" on storage.objects
  for select using (bucket_id = 'menu');

drop policy if exists "admin write menu bucket" on storage.objects;
create policy "admin write menu bucket" on storage.objects
  for all to authenticated using (bucket_id = 'menu' and public.is_admin())
  with check (bucket_id = 'menu' and public.is_admin());

-- ============================================================================
-- بيانات أولية (Seed) — عدّلها لاحقاً من لوحة الإدارة
-- ============================================================================
insert into public.restaurant_settings (name, phone, whatsapp, address, city, delivery_zones, working_hours, delivery_fee, min_order, is_open, latitude, longitude, facebook_url, instagram_url)
select 'مستر بيتزا', '07700000000', '9647700000000', 'الشارع الرئيسي، قرب الجسر الكبير', 'بغداد',
       array['الكرادة','المنصور','الجادرية','زيونة','الكاظمية','الأعظمية'],
       'يومياً من 11:00 صباحاً حتى 12:00 منتصف الليل', 3000, 5000, true, 33.3152, 44.3661,
       'https://facebook.com', 'https://instagram.com'
where not exists (select 1 from public.restaurant_settings);

-- الأقسام
insert into public.categories (name, slug, description, sort_order) values
  ('بيتزا','pizza','بيتزا إيطالية بعجينة طازجة',1),
  ('برغر','burger','برغر لحم ودجاج مشوي',2),
  ('سندويش','sandwich','سندويشات ساخنة وشهية',3),
  ('مقبلات','sides','بطاطا وأجنحة ومقرمشات',4),
  ('مشروبات','drinks','مشروبات غازية وعصائر',5),
  ('عروض','offers','عروض اليوم بأسعار مميزة',6),
  ('وجبات عائلية','family','وجبات تكفي العائلة',7)
on conflict (slug) do nothing;

-- منتجات نموذجية (بيتزا مع أحجام وإضافات)
do $$
declare pizza_id uuid; burger_id uuid; p_id uuid;
begin
  select id into pizza_id from public.categories where slug='pizza';
  select id into burger_id from public.categories where slug='burger';

  if not exists (select 1 from public.products where slug='margherita') then
    insert into public.products (category_id,name,slug,description,base_price,discount_price,is_featured)
    values (pizza_id,'بيتزا مارغريتا','margherita','صلصة طماطم، موزاريلا، ريحان طازج',9000,null,true)
    returning id into p_id;
    insert into public.product_sizes (product_id,name,price_delta,is_default,sort_order) values
      (p_id,'صغير',0,true,1),(p_id,'وسط',3000,false,2),(p_id,'كبير',6000,false,3);
    insert into public.product_addons (product_id,name,price) values
      (p_id,'جبن إضافي',1500),(p_id,'زيتون',1000),(p_id,'فطر',1500),(p_id,'بيبروني',2000);
  end if;

  if not exists (select 1 from public.products where slug='pepperoni') then
    insert into public.products (category_id,name,slug,description,base_price,discount_price,is_featured)
    values (pizza_id,'بيتزا بيبروني','pepperoni','بيبروني حار، موزاريلا، صلصة خاصة',11000,9000,true)
    returning id into p_id;
    insert into public.product_sizes (product_id,name,price_delta,is_default,sort_order) values
      (p_id,'صغير',0,true,1),(p_id,'وسط',3000,false,2),(p_id,'كبير',6000,false,3);
    insert into public.product_addons (product_id,name,price) values
      (p_id,'جبن إضافي',1500),(p_id,'زيتون',1000),(p_id,'فطر',1500);
  end if;

  if not exists (select 1 from public.products where slug='cheese-burger') then
    insert into public.products (category_id,name,slug,description,base_price,is_featured)
    values (burger_id,'تشيز برغر','cheese-burger','لحم بقري مشوي، جبنة شيدر، خس وطماطم',7000,true)
    returning id into p_id;
    insert into public.product_sizes (product_id,name,price_delta,is_default,sort_order) values
      (p_id,'عادي',0,true,1),(p_id,'دبل',3000,false,2);
  end if;
end $$;

-- كوبونات نموذجية
insert into public.coupons (code, description, discount_percent, max_discount, min_order) values
  ('WELCOME','خصم ترحيبي 10%',10,5000,10000),
  ('PIZZA20','خصم 20% على الطلبات فوق 20 ألف',20,8000,20000)
on conflict (code) do nothing;

-- ============================================================================
-- بعد التنفيذ:
-- 1) أنشئ مستخدم المدير من Authentication > Users (أو واجهة /admin/login).
-- 2) أضف صفّه إلى جدول users ليحصل على صلاحيات الإدارة:
--    insert into public.users (id, email, role)
--    select id, email, 'admin' from auth.users where email = 'admin@example.com';
-- ============================================================================
