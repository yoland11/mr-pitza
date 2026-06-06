import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { findMemoryOrder, memoryOrders } from './memoryStore';
import type { Order } from '@/lib/types';

/** جلب طلب بالكود أو رقم الهاتف (يُستخدم في التتبّع — جانب الخادم فقط) */
export async function findOrder(opts: { code?: string; phone?: string }): Promise<Order | null> {
  if (!isSupabaseConfigured) {
    return findMemoryOrder(opts);
  }
  const supabase = createAdminClient();
  let q = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }).limit(1);
  if (opts.code) q = q.eq('code', opts.code.toUpperCase());
  else if (opts.phone) q = q.eq('customer_phone', opts.phone);
  const { data } = await q.single();
  return (data as Order) ?? null;
}

/** جلب طلب بالمعرّف (للفاتورة) */
export async function getOrderById(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured) {
    return memoryOrders.find((o) => o.id === id) ?? null;
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single();
  return (data as Order) ?? null;
}
