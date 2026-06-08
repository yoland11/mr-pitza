'use client';

import {
  Banknote,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Receipt,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createClient } from '@/lib/supabase/client';
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/lib/types';
import { formatDateTime, formatPrice } from '@/lib/utils';

interface DayPoint { label: string; value: number }
interface Ranked { name: string; qty: number }
interface Stats {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  todayCount: number;
  avgOrder: number;
  cancelledCount: number;
  topProducts: Ranked[];
  topCategories: Ranked[];
  topCustomers: Ranked[];
  recent: Order[];
  chart: DayPoint[];
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-700',
  in_oven: 'bg-orange-100 text-orange-700',
  ready: 'bg-purple-100 text-purple-700',
  on_the_way: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
      const week = new Date(now.getTime() - 7 * 86400000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const rangeStart = new Date(Math.min(week.getTime(), monthStart.getTime()));

      const [{ data: ranged }, { data: recent }, { data: items }, { data: products }, { data: categories }, { data: topProfiles }] =
        await Promise.all([
          supabase.from('orders').select('total, status, created_at').gte('created_at', rangeStart.toISOString()),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('order_items').select('product_name, product_id, quantity').limit(2000),
          supabase.from('products').select('id, category_id'),
          supabase.from('categories').select('id, name'),
          supabase.from('profiles').select('full_name, points').order('points', { ascending: false }).limit(5),
        ]);

      const orders = (ranged ?? []).map((o) => ({ ...o, total: Number(o.total), t: new Date(o.created_at) }));
      const notCancelled = orders.filter((o) => o.status !== 'cancelled');
      const sum = (arr: typeof orders) => arr.reduce((s, o) => s + o.total, 0);

      const todaySales = sum(notCancelled.filter((o) => o.t >= startToday));
      const weekSales = sum(notCancelled.filter((o) => o.t >= week));
      const monthSales = sum(notCancelled.filter((o) => o.t >= monthStart));
      const todayCount = orders.filter((o) => o.t >= startToday).length;
      const monthNC = notCancelled.filter((o) => o.t >= monthStart);
      const avgOrder = monthNC.length ? Math.round(monthSales / monthNC.length) : 0;
      const cancelledCount = orders.filter((o) => o.status === 'cancelled' && o.t >= monthStart).length;

      // أكثر المنتجات والأقسام مبيعاً
      const prodMap = new Map((products ?? []).map((p) => [p.id, p.category_id]));
      const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
      const byProduct = new Map<string, number>();
      const byCategory = new Map<string, number>();
      (items ?? []).forEach((it) => {
        byProduct.set(it.product_name, (byProduct.get(it.product_name) ?? 0) + it.quantity);
        const catId = it.product_id ? prodMap.get(it.product_id) : undefined;
        const catName = catId ? catMap.get(catId) : undefined;
        if (catName) byCategory.set(catName, (byCategory.get(catName) ?? 0) + it.quantity);
      });
      const rank = (m: Map<string, number>) =>
        [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));

      const topCustomers: Ranked[] = (topProfiles ?? [])
        .filter((p) => (p.points ?? 0) > 0)
        .map((p) => ({ name: p.full_name || 'عميل', qty: p.points ?? 0 }));

      // رسم 7 أيام
      const chart: DayPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startToday.getTime() - i * 86400000);
        const next = new Date(d.getTime() + 86400000);
        const value = sum(notCancelled.filter((o) => o.t >= d && o.t < next));
        chart.push({ label: new Intl.DateTimeFormat('ar', { weekday: 'short' }).format(d), value });
      }

      setStats({
        todaySales, weekSales, monthSales, todayCount, avgOrder, cancelledCount,
        topProducts: rank(byProduct), topCategories: rank(byCategory), topCustomers,
        recent: (recent as Order[]) ?? [], chart,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-brand-red" /></div>;
  }

  const cards = [
    { label: 'مبيعات اليوم', value: formatPrice(stats.todaySales), Icon: Banknote, color: 'bg-green-600' },
    { label: 'مبيعات الأسبوع', value: formatPrice(stats.weekSales), Icon: CalendarDays, color: 'bg-emerald-600' },
    { label: 'مبيعات الشهر', value: formatPrice(stats.monthSales), Icon: CalendarRange, color: 'bg-teal-600' },
    { label: 'طلبات اليوم', value: stats.todayCount, Icon: ShoppingBag, color: 'bg-brand-red' },
    { label: 'متوسط قيمة الطلب', value: formatPrice(stats.avgOrder), Icon: Receipt, color: 'bg-blue-600' },
    { label: 'الطلبات الملغية (الشهر)', value: stats.cancelledCount, Icon: XCircle, color: 'bg-rose-600' },
  ];

  const maxChart = Math.max(1, ...stats.chart.map((c) => c.value));

  return (
    <>
      <AdminPageHeader title="لوحة التحكم" subtitle="نظرة شاملة على أداء المطعم" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map(({ label, value, Icon, color }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${color}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="truncate text-xl font-black text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* رسم المبيعات آخر 7 أيام */}
      <div className="mt-6 card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
          <TrendingUp className="h-5 w-5 text-brand-red" /> مبيعات آخر 7 أيام
        </h2>
        <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
          {stats.chart.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-ink-muted tabular-nums">
                {c.value > 0 ? `${Math.round(c.value / 1000)}k` : ''}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-brand-red transition-all"
                  style={{ height: `${Math.max(4, (c.value / maxChart) * 100)}%` }}
                  title={formatPrice(c.value)}
                />
              </div>
              <span className="text-xs font-bold text-ink">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* الأكثر مبيعاً منتجات */}
        <RankCard title="المنتجات الأكثر مبيعاً" items={stats.topProducts} unit="طلب" />
        {/* الأكثر مبيعاً أقسام */}
        <RankCard title="الأقسام الأكثر مبيعاً" items={stats.topCategories} unit="طلب" />
      </div>

      {stats.topCustomers.length > 0 && (
        <div className="mt-6">
          <RankCard title="أكثر العملاء نقاطاً 🏆" items={stats.topCustomers} unit="نقطة" />
        </div>
      )}

      {/* آخر 10 طلبات */}
      <div className="mt-6 card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">آخر 10 طلبات</h2>
          <Link href="/admin/orders" className="text-sm font-bold text-brand-red hover:underline">عرض الكل</Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">لا توجد طلبات بعد</p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{o.code} — {o.customer_name}</p>
                  <p className="text-xs text-ink-muted">{formatDateTime(o.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`badge ${STATUS_BADGE[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
                  <span className="font-extrabold text-ink">{formatPrice(o.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function RankCard({ title, items, unit }: { title: string; items: Ranked[]; unit: string }) {
  const max = items[0]?.qty || 1;
  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
        <TrendingUp className="h-5 w-5 text-brand-red" /> {title}
      </h2>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">لا توجد بيانات بعد</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p, i) => (
            <li key={p.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-bold text-ink">{i + 1}. {p.name}</span>
                <span className="text-ink-muted">{p.qty} {unit}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-brand-red" style={{ width: `${(p.qty / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
