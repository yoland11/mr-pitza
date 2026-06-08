'use client';

import { Loader2, PackageCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order } from '@/lib/types';

/** الاسم المختصر: أول كلمة من اسم الزبون */
function shortName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export default function DisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const first = useRef(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('id, code, customer_name, status, created_at')
      .eq('status', 'ready')
      .order('created_at', { ascending: true })
      .limit(12);
    setOrders((data as Order[]) ?? []);
    if (first.current) {
      first.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-ink"><Loader2 className="h-10 w-10 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="min-h-screen bg-ink p-6 text-white">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-black sm:text-5xl">
          <PackageCheck className="h-10 w-10 text-brand-yellow" />
          الطلبات الجاهزة
        </h1>
        <p className="mt-2 text-white/60">يرجى استلام طلبك عند عرض رقمك</p>
      </header>

      {orders.length === 0 ? (
        <div className="grid place-items-center py-24 text-center text-white/50">
          <span className="text-6xl">🍕</span>
          <p className="mt-4 text-2xl font-bold">لا توجد طلبات جاهزة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {orders.map((o) => (
            <div key={o.id} className="animate-fade-up rounded-3xl bg-brand-gradient p-6 text-center shadow-card-hover">
              <p className="text-4xl font-black tracking-widest text-white sm:text-5xl">{o.code}</p>
              <p className="mt-2 text-lg font-bold text-brand-yellow">{shortName(o.customer_name)}</p>
              <span className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-bold">جاهز ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
