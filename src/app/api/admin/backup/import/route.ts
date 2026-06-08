import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStaffSession, roleAllowed } from '@/lib/auth/staff';

// جداول آمنة للاستيراد فقط (لا نلمس الطلبات والعملاء)
const ALLOWED = ['categories', 'products', 'product_sizes', 'product_addons', 'coupons', 'banners', 'suppliers', 'inventory_items'];

export async function POST(req: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false, error: 'الخدمة غير متاحة' }, { status: 400 });
  const session = await getStaffSession();
  if (!roleAllowed(session?.role, ['owner', 'manager'])) {
    return NextResponse.json({ ok: false, error: 'صلاحية غير كافية (مالك/مدير)' }, { status: 403 });
  }

  let body: { tables?: Record<string, unknown[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'ملف غير صالح' }, { status: 400 });
  }
  const tables = body.tables ?? {};
  const admin = createAdminClient();
  const result: Record<string, number> = {};

  for (const [name, rows] of Object.entries(tables)) {
    if (!ALLOWED.includes(name) || !Array.isArray(rows) || rows.length === 0) continue;
    const { error } = await admin.from(name).upsert(rows as Record<string, unknown>[], { onConflict: 'id' });
    if (!error) result[name] = rows.length;
  }

  return NextResponse.json({ ok: true, imported: result });
}
