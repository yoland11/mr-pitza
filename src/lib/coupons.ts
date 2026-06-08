import type { SupabaseClient } from '@supabase/supabase-js';
import type { Coupon } from '@/lib/types';

export interface CouponEval {
  valid: boolean;
  discount: number;
  error?: string;
}

/**
 * تقييم الكوبون وحساب الخصم — منطق موحّد للكوبونات المتقدمة.
 * يدعم: نسبة/مبلغ ثابت، نافذة زمنية، حد استخدام كلي/لكل مستخدم، أول طلب، العملاء فقط.
 * admin (service role) مطلوب للفحوصات المعتمدة على قاعدة البيانات.
 */
export async function evaluateCoupon(
  coupon: Coupon,
  subtotal: number,
  opts: { userId?: string | null; admin?: SupabaseClient | null } = {},
): Promise<CouponEval> {
  const now = new Date();
  if (!coupon.is_active) return { valid: false, discount: 0, error: 'الكوبون غير مفعّل' };
  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return { valid: false, discount: 0, error: 'لم يبدأ هذا العرض بعد' };
  if (coupon.expires_at && new Date(coupon.expires_at) < now)
    return { valid: false, discount: 0, error: 'انتهت صلاحية الكوبون' };
  if (subtotal < coupon.min_order)
    return { valid: false, discount: 0, error: `الحد الأدنى ${coupon.min_order.toLocaleString('en-US')} د.ع` };
  if (coupon.customers_only && !opts.userId)
    return { valid: false, discount: 0, error: 'هذا الكوبون للعملاء المسجّلين فقط — سجّل الدخول' };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
    return { valid: false, discount: 0, error: 'انتهى عدد مرات استخدام الكوبون' };

  // فحوصات تعتمد على قاعدة البيانات (لكل مستخدم / أول طلب)
  if (opts.admin && opts.userId) {
    if (coupon.per_user_limit != null) {
      const { count } = await opts.admin
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', opts.userId);
      if ((count ?? 0) >= coupon.per_user_limit)
        return { valid: false, discount: 0, error: 'استخدمت هذا الكوبون من قبل' };
    }
    if (coupon.first_order_only) {
      const { count } = await opts.admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', opts.userId);
      if ((count ?? 0) > 0)
        return { valid: false, discount: 0, error: 'هذا الكوبون لأول طلب فقط' };
    }
  } else if (coupon.first_order_only && !opts.userId) {
    return { valid: false, discount: 0, error: 'هذا الكوبون لأول طلب فقط — سجّل الدخول' };
  }

  // حساب الخصم
  let discount: number;
  if (coupon.type === 'fixed') {
    discount = Math.min(coupon.amount, subtotal);
  } else {
    discount = Math.round((subtotal * coupon.discount_percent) / 100);
    if (coupon.max_discount != null) discount = Math.min(discount, coupon.max_discount);
  }
  return { valid: true, discount };
}
