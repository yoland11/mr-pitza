'use client';

import { ChefHat, Flame, Loader2, PackageCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Order, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLUMNS: { key: OrderStatus[]; title: string; color: string; Icon: typeof ChefHat; next: OrderStatus; nextLabel: string }[] = [
  { key: ['received'], title: 'طلبات جديدة', color: 'border-blue-400 bg-blue-50', Icon: ChefHat, next: 'preparing', nextLabel: 'بدء التحضير' },
  { key: ['preparing', 'in_oven'], title: 'قيد التحضير', color: 'border-amber-400 bg-amber-50', Icon: Flame, next: 'ready', nextLabel: 'جاهز ✓' },
  { key: ['ready'], title: 'جاهزة للتسليم', color: 'border-green-500 bg-green-50', Icon: PackageCheck, next: 'on_the_way', nextLabel: 'تم التسليم/الخروج' },
];

function minutesSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .in('status', ['received', 'preparing', 'in_oven', 'ready'])
      .order('created_at', { ascending: true });
    setOrders((data as Order[]) ?? []);
    if (firstLoad.current) {
      firstLoad.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [load]);

  const advance = async (id: string, status: OrderStatus) => {
    const supabase = createClient();
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return toast.error('تعذّر التحديث');
    fetch('/api/notify/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: id }) }).catch(() => {});
    setOrders((p) => (status === 'on_the_way' ? p.filter((o) => o.id !== id) : p.map((o) => (o.id === id ? { ...o, status } : o))));
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-ink"><Loader2 className="h-9 w-9 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="min-h-screen bg-ink p-4 text-white">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red"><ChefHat className="h-5 w-5" /></span>
          <h1 className="text-xl font-black">شاشة المطبخ — مستر بيتزا</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20"><RefreshCw className="h-5 w-5" /></button>
          <Link href="/admin" className="text-sm font-bold text-brand-yellow hover:underline">لوحة الإدارة ↗</Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => col.key.includes(o.status));
          return (
            <section key={col.title} className="rounded-2xl bg-white/5 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-lg font-extrabold"><col.Icon className="h-5 w-5 text-brand-yellow" /> {col.title}</h2>
                <span className="badge bg-white/15 text-white">{colOrders.length}</span>
              </div>
              <div className="space-y-3">
                {colOrders.length === 0 && <p className="px-1 py-6 text-center text-sm text-white/50">لا توجد طلبات</p>}
                {colOrders.map((o) => {
                  const mins = minutesSince(o.created_at);
                  return (
                    <div key={o.id} className={cn('rounded-xl border-r-4 bg-white p-3 text-ink', col.color)}>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-brand-red">{o.code}</span>
                        <span className={cn('text-sm font-bold', mins >= 20 ? 'text-brand-red' : 'text-ink-muted')}>{mins} دقيقة</span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm font-bold text-ink">
                        {o.items?.map((it) => (
                          <li key={it.id} className="flex items-start gap-1">
                            <span className="text-brand-red">×{it.quantity}</span>
                            <span>{it.product_name}{it.size_name ? ` (${it.size_name})` : ''}
                              {it.addons.length > 0 && <span className="block text-xs font-normal text-ink-muted">+ {it.addons.map((a) => a.name).join('، ')}</span>}
                              {it.notes && <span className="block text-xs font-normal text-brand-red">ملاحظة: {it.notes}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => advance(o.id, col.next)} className="btn-primary btn-sm mt-3 w-full">{col.nextLabel}</button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
