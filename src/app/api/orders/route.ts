import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { addMemoryOrder } from '@/lib/data/memoryStore';
import { seedCoupons, seedSettings } from '@/lib/data/seed';
import { createOrderSchema } from '@/lib/validation';
import { evaluateCoupon } from '@/lib/coupons';
import { notifyOrderStatus } from '@/lib/whatsapp';
import { generateOrderCode } from '@/lib/utils';
import type { Coupon, Order, OrderItem, PaymentStatus, RestaurantSettings } from '@/lib/types';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: first?.message ?? 'بيانات غير مكتملة', field: first?.path?.[0] },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const supabase = isSupabaseConfigured ? createAdminClient() : null;

  // إعدادات المطعم (لرسوم التوصيل والحد الأدنى)
  let settings: RestaurantSettings = seedSettings;
  if (supabase) {
    const { data } = await supabase.from('restaurant_settings').select('*').limit(1).single();
    if (data) settings = data as RestaurantSettings;
  }

  if (!settings.is_open) {
    return NextResponse.json(
      { ok: false, error: settings.closed_message || 'المطعم مغلق حالياً، حاول لاحقاً' },
      { status: 423 },
    );
  }

  // إعادة حساب المبالغ على الخادم (عدم الوثوق بأرقام العميل)
  const subtotal = input.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  if (subtotal <= 0) {
    return NextResponse.json({ ok: false, error: 'السلة فارغة' }, { status: 422 });
  }
  if (subtotal < settings.min_order) {
    return NextResponse.json(
      { ok: false, error: `الحد الأدنى للطلب ${settings.min_order.toLocaleString('en-US')} د.ع` },
      { status: 422 },
    );
  }

  // التحقق من الكوبون وإعادة حساب الخصم (منطق موحّد متقدم)
  let discount = 0;
  let appliedCode: string | null = null;
  let appliedCoupon: Coupon | null = null;
  if (input.couponCode) {
    let coupon: Coupon | null = null;
    if (supabase) {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', input.couponCode.toUpperCase())
        .eq('is_active', true)
        .limit(1)
        .single();
      coupon = (data as Coupon) ?? null;
    } else {
      coupon = seedCoupons.find((c) => c.code.toUpperCase() === input.couponCode!.toUpperCase()) ?? null;
    }
    if (coupon) {
      const eval0 = await evaluateCoupon(coupon, subtotal, { userId: input.userId, admin: supabase });
      if (eval0.valid) {
        discount = eval0.discount;
        appliedCode = coupon.code;
        appliedCoupon = coupon;
      }
    }
  }

  const deliveryFee = input.deliveryMethod === 'delivery' ? settings.delivery_fee : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const code = generateOrderCode();
  const now = new Date().toISOString();

  // الدفع بالبطاقة (QR) يبدأ بانتظار التأكيد، والكاش غير مدفوع
  const paymentStatus: PaymentStatus =
    input.paymentMethod === 'card' ? 'awaiting_confirmation' : 'unpaid';

  // ===== الإنتاج: Supabase =====
  if (supabase) {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        code,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        city: input.city,
        address: input.address || null,
        landmark: input.landmark || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        delivery_method: input.deliveryMethod,
        payment_method: input.paymentMethod,
        payment_status: paymentStatus,
        status: 'received',
        notes: input.notes || null,
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        total,
        coupon_code: appliedCode,
        user_id: input.userId ?? null,
      })
      .select('id, code')
      .single();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'تعذّر إنشاء الطلب' }, { status: 500 });
    }

    const itemsPayload = input.items.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      product_name: it.name,
      size_name: it.sizeName,
      addons: it.addons,
      unit_price: it.unitPrice,
      quantity: it.quantity,
      line_total: it.unitPrice * it.quantity,
      notes: it.notes || null,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ ok: false, error: 'تعذّر حفظ عناصر الطلب' }, { status: 500 });
    }

    // تسجيل استخدام الكوبون وزيادة العدّاد
    if (appliedCoupon) {
      await supabase.from('coupon_redemptions').insert({
        coupon_id: appliedCoupon.id,
        user_id: input.userId ?? null,
        order_id: order.id,
        code: appliedCoupon.code,
      });
      await supabase
        .from('coupons')
        .update({ used_count: (appliedCoupon.used_count ?? 0) + 1 })
        .eq('id', appliedCoupon.id);
    }

    // إشعار العميل بإنشاء الطلب (واتساب/Push) — آمن ولا يكسر شيئاً
    try {
      await notifyOrderStatus(order.id);
    } catch {
      /* تجاهل */
    }

    return NextResponse.json({ ok: true, id: order.id, code: order.code });
  }

  // ===== المعاينة: مخزن الذاكرة =====
  const items: OrderItem[] = input.items.map((it, i) => ({
    id: `mem-item-${i}`,
    order_id: 'mem',
    product_id: it.productId,
    product_name: it.name,
    size_name: it.sizeName,
    addons: it.addons,
    unit_price: it.unitPrice,
    quantity: it.quantity,
    line_total: it.unitPrice * it.quantity,
    notes: it.notes || null,
  }));
  const order: Order = {
    id: `mem-${code}`,
    code,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    city: input.city,
    address: input.address || null,
    landmark: input.landmark || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    delivery_method: input.deliveryMethod,
    payment_method: input.paymentMethod,
    payment_status: paymentStatus,
    status: 'received',
    notes: input.notes || null,
    user_id: input.userId ?? null,
    driver_id: null,
    branch_id: null,
    subtotal,
    discount,
    delivery_fee: deliveryFee,
    total,
    coupon_code: appliedCode,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
    items,
  };
  addMemoryOrder(order);
  return NextResponse.json({ ok: true, id: order.id, code: order.code });
}
