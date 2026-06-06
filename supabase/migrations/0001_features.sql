-- ============================================================================
-- مستر بيتزا — ترقية المميزات (آمنة، بدون حذف بيانات)
-- نفّذ هذا الملف مرة واحدة على قاعدة بيانات موجودة.
-- يستخدم: add column if not exists / create table if not exists / drop policy if exists ثم create.
-- ============================================================================

-- ===== 1) حالة دفع جديدة: بانتظار تأكيد الدفع =====
alter type payment_status add value if not exists 'awaiting_confirmation';

-- ===== 2) أعمدة إعدادات المطعم الجديدة =====
alter table public.restaurant_settings add column if not exists closed_message text default 'عذراً، المطعم مغلق حالياً. نعود قريباً!';
alter table public.restaurant_settings add column if not exists map_url text;
alter table public.restaurant_settings add column if not exists qr_payment_image_url text;
alter table public.restaurant_settings add column if not exists sound_alerts boolean not null default true;

-- ===== 3) أعمدة الطلبات الجديدة =====
alter table public.orders add column if not exists reviewed_at timestamptz;

-- ===== 4) جدول صور المنتج =====
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on public.product_images(product_id);
alter table public.product_images enable row level security;

drop policy if exists "public read product_images" on public.product_images;
create policy "public read product_images" on public.product_images for select using (true);
drop policy if exists "admin all product_images" on public.product_images;
create policy "admin all product_images" on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===== 5) جدول التقييمات =====
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
alter table public.reviews enable row level security;

drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews for select using (is_approved);
drop policy if exists "admin all reviews" on public.reviews;
create policy "admin all reviews" on public.reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===== 6) جدول اشتراكات الإشعارات =====
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_code text,
  endpoint text unique,
  subscription jsonb,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

drop policy if exists "admin read push" on public.push_subscriptions;
create policy "admin read push" on public.push_subscriptions for select to authenticated
  using (public.is_admin());
-- الإدراج يتم عبر service_role من API (يتجاوز RLS)

-- ===== انتهى =====
