import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsApp } from '@/lib/whatsapp';
import { seedCategories, seedProducts, seedSettings } from '@/lib/data/seed';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types';
import { effectivePrice, formatPrice } from '@/lib/utils';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mr-pizza-verify';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** تحقّق الويبهوك من Meta */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('forbidden', { status: 403 });
}

async function buildReply(text: string): Promise<string> {
  const t = text.trim();
  const admin = isSupabaseConfigured ? createAdminClient() : null;

  // أوقات العمل / العنوان
  if (/وقت|اوقات|أوقات|دوام|مفتوح|تفتح/.test(t)) {
    const settings = admin ? (await admin.from('restaurant_settings').select('*').limit(1).single()).data ?? seedSettings : seedSettings;
    return `🕒 أوقات العمل: ${settings.working_hours}\n📍 ${settings.address} — ${settings.city}\n📞 ${settings.phone}`;
  }

  // العروض
  if (/عرض|عروض|خصم|كوبون/.test(t)) {
    return `🔥 شاهد أحدث عروضنا وكوبونات الخصم هنا:\n${SITE_URL}/offers`;
  }

  // تتبّع الطلب
  const codeMatch = t.match(/MP-?[A-Z0-9]{5}/i);
  if (/طلب|تتبع|تتبّع|وين/.test(t) || codeMatch) {
    if (codeMatch && admin) {
      const code = codeMatch[0].toUpperCase().replace('MP', 'MP-').replace('--', '-');
      const { data: order } = await admin.from('orders').select('code,status,customer_name').eq('code', code).single();
      if (order) return `📦 طلبك ${order.code}\nالحالة: ${ORDER_STATUS_LABELS[order.status as OrderStatus]}\nتتبّع: ${SITE_URL}/track?code=${order.code}`;
      return `لم أجد طلباً بهذا الكود. تأكّد من الكود أو تتبّع عبر: ${SITE_URL}/track`;
    }
    return `🔎 لتتبّع طلبك أرسل كود الطلب (مثال: MP-AB12C) أو افتح:\n${SITE_URL}/track`;
  }

  // المنيو والأسعار
  if (/منيو|المنيو|اكل|طعام|سعر|اسعار|أسعار|بيتزا|برغر/.test(t)) {
    let lines = '🍕 منيو مستر بيتزا:\n';
    if (admin) {
      const { data: prods } = await admin.from('products').select('name, base_price, discount_price').eq('is_available', true).order('is_featured', { ascending: false }).limit(8);
      (prods ?? []).forEach((p) => { lines += `• ${p.name} — ${formatPrice(effectivePrice(p as { base_price: number; discount_price: number | null }))}\n`; });
    } else {
      seedProducts.slice(0, 8).forEach((p) => { lines += `• ${p.name} — ${formatPrice(effectivePrice(p))}\n`; });
    }
    lines += `\nاطلب الآن: ${SITE_URL}/menu`;
    return lines;
  }

  // ترحيب افتراضي
  const cats = admin ? ((await admin.from('categories').select('name').eq('is_active', true).limit(8)).data ?? []).map((c) => c.name) : seedCategories.map((c) => c.name);
  return [
    'أهلاً بك في مستر بيتزا 🍕',
    'كيف أساعدك؟ أرسل:',
    '• «المنيو» لعرض الأصناف والأسعار',
    '• «العروض» للخصومات',
    '• «الأوقات» لساعات العمل',
    '• «طلب MP-XXXXX» لتتبّع طلبك',
    cats.length ? `\nأقسامنا: ${cats.join('، ')}` : '',
    `\nاطلب الآن: ${SITE_URL}/menu`,
  ].filter(Boolean).join('\n');
}

/** استقبال رسائل العملاء والرد التلقائي */
export async function POST(req: Request) {
  let body: { entry?: { changes?: { value?: { messages?: { from: string; text?: { body: string } }[] } }[] }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  try {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
    for (const m of messages) {
      const text = m.text?.body ?? '';
      if (!m.from) continue;
      const reply = await buildReply(text);
      await sendWhatsApp(m.from, reply);
    }
  } catch {
    /* تجاهل أخطاء المعالجة */
  }
  return NextResponse.json({ ok: true });
}
