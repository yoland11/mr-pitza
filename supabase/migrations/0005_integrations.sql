-- ============================================================================
-- مستر بيتزا — المرحلة 5: التكاملات (واتساب + إشعارات + تتبع مباشر + تعدد الفروع)
-- آمن وقابل للتكرار. لا يحذف أي بيانات. يتطلّب 0003 (is_admin/has_role).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ===== 1) سجل الإشعارات =====
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('whatsapp','push')),
  recipient text,
  order_id uuid references public.orders(id) on delete set null,
  status text,
  message text,
  success boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "admin read notifications" on public.notifications;
create policy "admin read notifications" on public.notifications for select to authenticated using (public.is_admin());

-- ===== 2) موقع السائق (للتتبع المباشر) =====
alter table public.drivers add column if not exists latitude double precision;
alter table public.drivers add column if not exists longitude double precision;
alter table public.drivers add column if not exists location_updated_at timestamptz;

-- ===== 3) تعدد الفروع =====
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  city text,
  is_active boolean not null default true,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.branches enable row level security;
drop policy if exists "public read branches" on public.branches;
create policy "public read branches" on public.branches for select using (is_active);
drop policy if exists "branches manage" on public.branches;
create policy "branches manage" on public.branches for all to authenticated
  using (public.has_role(array['owner','manager','admin'])) with check (public.has_role(array['owner','manager','admin']));

-- فرع رئيسي افتراضي
insert into public.branches (name, is_main, is_active)
select 'الفرع الرئيسي', true, true
where not exists (select 1 from public.branches);

-- ربط الكيانات بالفرع (اختياري؛ NULL = الفرع الرئيسي)
alter table public.orders add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.drivers add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.inventory_items add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.expenses add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.revenues add column if not exists branch_id uuid references public.branches(id) on delete set null;
create index if not exists idx_orders_branch on public.orders(branch_id);

-- ===== انتهى =====
