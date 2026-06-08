import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStaffSession, roleAllowed } from '@/lib/auth/staff';
import type { UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['owner', 'manager', 'admin', 'cashier', 'kitchen', 'driver', 'employee', 'staff'];

/** إنشاء حساب موظف جديد (للمالك/المدير فقط) */
export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'الخدمة غير متاحة' }, { status: 400 });
  }
  const session = await getStaffSession();
  if (!roleAllowed(session?.role, ['owner', 'manager'])) {
    return NextResponse.json({ ok: false, error: 'صلاحية غير كافية' }, { status: 403 });
  }

  let body: { email?: string; password?: string; full_name?: string; role?: UserRole };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  const full_name = (body.full_name ?? '').trim();
  const role = body.role ?? 'employee';
  if (!email || password.length < 6 || !ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: 'بيانات غير صحيحة (كلمة المرور 6 أحرف على الأقل)' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !created.user) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'تعذّر إنشاء الحساب' }, { status: 422 });
  }

  const { error: rowError } = await admin.from('users').insert({
    id: created.user.id,
    email,
    full_name: full_name || null,
    role,
  });
  if (rowError) {
    return NextResponse.json({ ok: false, error: 'تعذّر حفظ صلاحية الموظف' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}
