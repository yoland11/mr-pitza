import { NextResponse } from 'next/server';
import { findOrder } from '@/lib/data/orders';
import { trackSchema } from '@/lib/validation';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' },
      { status: 422 },
    );
  }
  const { phone, code } = parsed.data;

  const order = await findOrder({
    code: code || undefined,
    phone: phone || undefined,
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: 'لم يتم العثور على الطلب' }, { status: 404 });
  }

  // إرجاع بيانات آمنة للعرض العام
  return NextResponse.json({
    ok: true,
    order: {
      code: order.code,
      status: order.status,
      customer_name: order.customer_name,
      delivery_method: order.delivery_method,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      total: order.total,
      created_at: order.created_at,
      city: order.city,
      reviewed: !!order.reviewed_at,
      items: order.items?.map((i) => ({
        product_name: i.product_name,
        size_name: i.size_name,
        quantity: i.quantity,
        line_total: i.line_total,
      })),
    },
  });
}
