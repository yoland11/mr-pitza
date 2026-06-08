-- ============================================================================
-- مستر بيتزا — المرحلة 2: العمليات (السائقون + المطبخ + الاستقبال + الصلاحيات)
-- آمن وقابل للتكرار. لا يحذف أي بيانات.
-- ============================================================================

-- ===== 1) نظام الصلاحيات (Roles) =====
-- توسيع الأدوار المسموحة في جدول المستخدمين
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('owner','manager','admin','cashier','kitchen','driver','employee','staff'));

-- صلاحية لوحة الإدارة (الإدارة الخلفية) — تستثني السائق والمطبخ والموظف العام
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('owner','manager','admin','cashier','staff')
  );
$$;

-- فحص أدوار محدّدة
create or replace function public.has_role(roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = any(roles));
$$;

-- ===== 2) السائقون =====
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  vehicle text,
  code text not null, -- رمز دخول السائق (هاتف + رمز)
  status text not null default 'available' check (status in ('available','busy','offline')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_drivers_phone on public.drivers(phone);
alter table public.drivers enable row level security;
drop policy if exists "admin all drivers" on public.drivers;
create policy "admin all drivers" on public.drivers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===== 3) ربط الطلب بالسائق =====
alter table public.orders add column if not exists driver_id uuid references public.drivers(id) on delete set null;
create index if not exists idx_orders_driver on public.orders(driver_id);

-- ===== 4) سجل إسناد الطلبات =====
create table if not exists public.driver_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned','picked_up','delivered','cancelled')),
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_assignments_driver on public.driver_assignments(driver_id);
create index if not exists idx_assignments_order on public.driver_assignments(order_id);
alter table public.driver_assignments enable row level security;
drop policy if exists "admin all assignments" on public.driver_assignments;
create policy "admin all assignments" on public.driver_assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===== 5) صلاحيات المطبخ والاستقبال على الطلبات (قراءة + تحديث الحالة) =====
drop policy if exists "kitchen reads orders" on public.orders;
create policy "kitchen reads orders" on public.orders for select to authenticated
  using (public.has_role(array['owner','manager','admin','cashier','kitchen']));

drop policy if exists "kitchen updates orders" on public.orders;
create policy "kitchen updates orders" on public.orders for update to authenticated
  using (public.has_role(array['owner','manager','admin','cashier','kitchen']))
  with check (public.has_role(array['owner','manager','admin','cashier','kitchen']));

drop policy if exists "kitchen reads order items" on public.order_items;
create policy "kitchen reads order items" on public.order_items for select to authenticated
  using (public.has_role(array['owner','manager','admin','cashier','kitchen']));

-- ملاحظة: تطبيق السائق يعمل عبر API بصلاحية الخدمة (service role) مع رمز دخول موقّع،
-- لذلك لا حاجة لسياسات RLS خاصة بالسائق.

-- ===== 6) إدارة المستخدمين: القراءة للطاقم، والتعديل للمالك/المدير فقط =====
drop policy if exists "admin all users" on public.users;
drop policy if exists "staff read users" on public.users;
create policy "staff read users" on public.users for select to authenticated using (public.is_admin());
drop policy if exists "owners manage users" on public.users;
create policy "owners manage users" on public.users for all to authenticated
  using (public.has_role(array['owner','manager'])) with check (public.has_role(array['owner','manager']));

-- ملاحظة مهمة: بعد تنفيذ هذا الملف، عيّن حسابك الحالي كمالك حتى تتمكّن من إدارة الموظفين:
--   update public.users set role = 'owner' where email = 'admin@example.com';

-- ===== انتهى =====
