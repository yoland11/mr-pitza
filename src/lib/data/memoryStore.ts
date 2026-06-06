import type { Order } from '@/lib/types';

/**
 * مخزن طلبات مؤقت في الذاكرة — يُستخدم فقط في وضع المعاينة (بدون Supabase)
 * كي يعمل إنشاء الطلب وتتبّعه أثناء التطوير. لا يُستخدم في الإنتاج.
 */
const globalForOrders = globalThis as unknown as { __mrPizzaOrders?: Order[] };

export const memoryOrders: Order[] = globalForOrders.__mrPizzaOrders ?? [];
if (!globalForOrders.__mrPizzaOrders) {
  globalForOrders.__mrPizzaOrders = memoryOrders;
}

export function addMemoryOrder(order: Order) {
  memoryOrders.unshift(order);
}

export function findMemoryOrder(opts: { code?: string; phone?: string }): Order | null {
  return (
    memoryOrders.find((o) => {
      if (opts.code && o.code.toUpperCase() === opts.code.toUpperCase()) return true;
      if (opts.phone && o.customer_phone.replace(/\D/g, '').endsWith(opts.phone.replace(/\D/g, ''))) return true;
      return false;
    }) ?? null
  );
}
