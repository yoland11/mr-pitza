import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** دمج أصناف Tailwind بأمان */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** تنسيق المبلغ بالدينار العراقي */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('en-US')} د.ع`;
}

/** تنسيق التاريخ والوقت بالعربية */
export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** توليد كود طلب قصير وسهل القراءة، مثل MP-7K3Q9 */
export function generateOrderCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MP-${s}`;
}

/** السعر الفعّال للمنتج (بعد الخصم إن وُجد) */
export function effectivePrice(p: { base_price: number; discount_price: number | null }): number {
  return p.discount_price != null && p.discount_price < p.base_price
    ? p.discount_price
    : p.base_price;
}

/** نسبة الخصم كرقم صحيح */
export function discountPercent(p: { base_price: number; discount_price: number | null }): number {
  if (p.discount_price == null || p.discount_price >= p.base_price) return 0;
  return Math.round(((p.base_price - p.discount_price) / p.base_price) * 100);
}

/** تطبيع رقم الهاتف العراقي للمقارنة (إزالة المسافات والرموز) */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()+]/g, '').replace(/^00964/, '0').replace(/^964/, '0');
}

/** رابط واتساب جاهز */
export function whatsappLink(number: string, text?: string): string {
  const clean = number.replace(/[^\d]/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${clean}${q}`;
}

/** تأخير بسيط */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
