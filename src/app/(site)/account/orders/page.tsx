'use client';

import { Loader2, Receipt, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/lib/store/cart';
import { toast } from '@/lib/store/toast';
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/lib/types';
import { cn, formatDateTime, formatPrice } from '@/lib/utils';

const BADGE: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-700',
  in_oven: 'bg-orange-100 text-orange-700',
  ready: 'bg-purple-100 text-purple-700',
  on_the_way: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AccountOrders() {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const reorder = (order: Order) => {
    (order.items ?? []).forEach((it) => {
      addItem({
        productId: it.product_id ?? it.id,
        name: it.product_name,
        image_url: null,
        basePrice: it.unit_price,
        size: it.size_name ? { id: `re-${it.id}`, name: it.size_name, priceDelta: 0 } : null,
        addons: [],
        quantity: it.quantity,
        notes: it.notes ?? '',
      });
    });
    toast.success('تمت إضافة منتجات الطلب إلى السلة');
    router.push('/cart');
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>;

  if (orders.length === 0) {
    return (
      <div className="card grid place-items-center py-16 text-center text-ink-muted">
        <Receipt className="h-9 w-9 text-brand-red" />
        <p className="mt-2 font-bold text-ink">لا توجد طلبات بعد</p>
        <Link href="/menu" className="btn-primary mt-3">اطلب الآن</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-extrabold text-ink">{o.code}</p>
              <p className="text-xs text-ink-muted">{formatDateTime(o.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('badge', BADGE[o.status])}>{ORDER_STATUS_LABELS[o.status]}</span>
              <span className="font-black text-brand-red">{formatPrice(o.total)}</span>
            </div>
          </div>

          <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-ink">
            {o.items?.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.product_name} {it.size_name ? `(${it.size_name})` : ''} × {it.quantity}</span>
                <span className="font-bold">{formatPrice(it.line_total)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2">
            <button onClick={() => reorder(o)} className="btn-primary btn-sm flex-1"><RotateCcw className="h-4 w-4" /> إعادة الطلب</button>
            <Link href={`/invoice/${o.id}`} className="btn-outline btn-sm flex-1"><Receipt className="h-4 w-4" /> الفاتورة</Link>
            <Link href={`/track?code=${o.code}`} className="btn-outline btn-sm flex-1">تتبّع</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
