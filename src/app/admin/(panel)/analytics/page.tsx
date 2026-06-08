'use client';

import { Bike, Clock, Coins, Loader2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';

interface Data {
  revenue: number;
  expenses: number;
  hours: number[]; // 24
  drivers: { name: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const start = new Date(Date.now() - 30 * 86400000);
      const [{ data: orders }, { data: exp }, { data: drivers }] = await Promise.all([
        supabase.from('orders').select('total, status, created_at, driver_id').gte('created_at', start.toISOString()),
        supabase.from('expenses').select('amount').gte('spent_at', start.toISOString().slice(0, 10)),
        supabase.from('drivers').select('id, name'),
      ]);

      const notCancelled = (orders ?? []).filter((o) => o.status !== 'cancelled');
      const revenue = notCancelled.reduce((s, o) => s + Number(o.total), 0);
      const expenses = (exp ?? []).reduce((s, e) => s + Number(e.amount), 0);

      const hours = new Array(24).fill(0);
      (orders ?? []).forEach((o) => { hours[new Date(o.created_at).getHours()]++; });

      const driverMap = new Map((drivers ?? []).map((d) => [d.id, d.name]));
      const byDriver = new Map<string, number>();
      notCancelled.filter((o) => o.status === 'delivered' && o.driver_id).forEach((o) => {
        byDriver.set(o.driver_id!, (byDriver.get(o.driver_id!) ?? 0) + 1);
      });
      const driversRank = [...byDriver.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([id, count]) => ({ name: driverMap.get(id) ?? 'سائق', count }));

      setData({ revenue, expenses, hours, drivers: driversRank });
      setLoading(false);
    })();
  }, []);

  if (loading || !data) return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-brand-red" /></div>;

  const maxHour = Math.max(1, ...data.hours);
  const profit = data.revenue - data.expenses;

  return (
    <>
      <AdminPageHeader title="التحليلات المتقدمة" subtitle="آخر 30 يوماً — الأرباح وساعات الذروة وأفضل السائقين" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'الإيرادات (30 يوم)', value: formatPrice(data.revenue), color: 'bg-green-600', Icon: TrendingUp },
          { label: 'المصروفات (30 يوم)', value: formatPrice(data.expenses), color: 'bg-rose-600', Icon: Coins },
          { label: 'صافي الربح', value: formatPrice(profit), color: profit >= 0 ? 'bg-brand-red' : 'bg-ink', Icon: Coins },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="card flex items-center gap-3 p-5">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${color}`}><Icon className="h-6 w-6" /></span>
            <div className="min-w-0"><p className="text-xs text-ink-muted">{label}</p><p className="truncate text-lg font-black text-ink">{value}</p></div>
          </div>
        ))}
      </div>

      {/* ساعات الذروة */}
      <div className="mt-6 card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink"><Clock className="h-5 w-5 text-brand-red" /> ساعات الذروة (عدد الطلبات حسب الساعة)</h2>
        <div className="flex h-44 items-end gap-1 overflow-x-auto">
          {data.hours.map((c, h) => (
            <div key={h} className="flex min-w-[3.2%] flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t bg-brand-red transition-all" style={{ height: `${Math.max(3, (c / maxHour) * 100)}%` }} title={`${c} طلب`} />
              </div>
              <span className="text-[9px] font-bold text-ink-muted">{h}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-ink-muted">المحور الأفقي = الساعة (0–23)</p>
      </div>

      {/* أفضل السائقين */}
      <div className="mt-6 card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink"><Bike className="h-5 w-5 text-brand-red" /> أفضل السائقين (طلبات مسلّمة)</h2>
        {data.drivers.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">لا توجد بيانات توصيل بعد</p>
        ) : (
          <ul className="space-y-3">
            {data.drivers.map((d, i) => {
              const max = data.drivers[0].count || 1;
              return (
                <li key={d.name}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-bold text-ink">{i + 1}. {d.name}</span><span className="text-ink-muted">{d.count} توصيلة</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand-red" style={{ width: `${(d.count / max) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
