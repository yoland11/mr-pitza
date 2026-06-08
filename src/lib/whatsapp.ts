import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { sendPush } from '@/lib/webpush';
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/lib/types';

const WA_TOKEN = process.env.WHATSAPP_TOKEN ?? '';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID ?? '';
const WA_API = process.env.WHATSAPP_API_VERSION || 'v21.0';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const isWhatsAppConfigured = WA_TOKEN.length > 10 && WA_PHONE_ID.length > 3;

/** تطبيع رقم عراقي إلى صيغة دولية لواتساب (9647XXXXXXXXX) */
export function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('964')) return digits;
  if (digits.startsWith('0')) return '964' + digits.slice(1);
  return digits;
}

/** إرسال رسالة واتساب نصية عبر Meta Cloud API. لا يفعل شيئاً إن لم تُضبط المفاتيح. */
export async function sendWhatsApp(to: string, text: string): Promise<boolean> {
  if (!isWhatsAppConfigured) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/${WA_API}/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toWaNumber(to),
        type: 'text',
        text: { body: text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function statusMessage(o: Pick<Order, 'code' | 'customer_name' | 'status'>): string {
  const track = `${SITE_URL}/track?code=${o.code}`;
  return [
    `مرحباً ${o.customer_name} 🍕`,
    `طلبك رقم ${o.code}`,
    `الحالة: ${ORDER_STATUS_LABELS[o.status]}`,
    `تتبّع الطلب: ${track}`,
    '— مستر بيتزا',
  ].join('\n');
}

/**
 * إشعار العميل بتغيّر حالة الطلب عبر واتساب + Web Push (إن توفّرا).
 * آمن: لا يكسر شيئاً إن لم تُضبط المفاتيح. يُسجّل في جدول notifications.
 */
export async function notifyOrderStatus(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('id, code, customer_name, customer_phone, status')
    .eq('id', orderId)
    .single();
  if (!order) return;

  const o = order as Pick<Order, 'id' | 'code' | 'customer_name' | 'customer_phone' | 'status'>;
  const text = statusMessage(o);

  // واتساب
  if (isWhatsAppConfigured && o.customer_phone) {
    const ok = await sendWhatsApp(o.customer_phone, text);
    await admin.from('notifications').insert({ channel: 'whatsapp', recipient: o.customer_phone, order_id: o.id, status: o.status, message: text, success: ok });
  }

  // Web Push — لكل اشتراكات هذا الطلب
  const { data: subs } = await admin.from('push_subscriptions').select('subscription').eq('order_code', o.code);
  for (const row of subs ?? []) {
    const ok = await sendPush(row.subscription, {
      title: 'تحديث طلبك 🍕',
      body: `طلب ${o.code}: ${ORDER_STATUS_LABELS[o.status as OrderStatus]}`,
      url: `/track?code=${o.code}`,
    });
    await admin.from('notifications').insert({ channel: 'push', recipient: o.code, order_id: o.id, status: o.status, message: 'push', success: ok });
  }
}
