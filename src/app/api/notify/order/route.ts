import { NextResponse } from 'next/server';
import { getStaffSession, roleAllowed } from '@/lib/auth/staff';
import { notifyOrderStatus } from '@/lib/whatsapp';

/** يُستدعى من لوحة الإدارة/المطبخ بعد تغيير حالة الطلب لإرسال إشعار العميل */
export async function POST(req: Request) {
  const session = await getStaffSession();
  if (!roleAllowed(session?.role, ['owner', 'manager', 'admin', 'cashier', 'kitchen', 'staff'])) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ ok: false }, { status: 422 });
  try {
    await notifyOrderStatus(body.orderId);
  } catch {
    /* تجاهل */
  }
  return NextResponse.json({ ok: true });
}
