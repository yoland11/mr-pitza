'use client';

import {
  ChevronDown,
  Copy,
  Download,
  Loader2,
  MapPin,
  Phone,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createClient } from '@/lib/supabase/client';
import { useAdminNotify } from '@/lib/store/adminNotify';
import { toast } from '@/lib/store/toast';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/types';
import { cn, formatDateTime, formatPrice } from '@/lib/utils';

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'awaiting_confirmation', 'paid'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const decrement = useAdminNotify((s) => s.decrement);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }).limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte('created_at', end.toISOString());
    }
    const { data } = await q;
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [filter, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id: string, status: OrderStatus, prev: OrderStatus) => {
    const supabase = createClient();
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return toast.error('تعذّر تحديث الحالة');
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
    if (prev === 'received' && status !== 'received') decrement();
    toast.success('تم تحديث حالة الطلب');
  };

  const changePayment = async (id: string, payment_status: PaymentStatus) => {
    const supabase = createClient();
    const { error } = await supabase.from('orders').update({ payment_status }).eq('id', id);
    if (error) return toast.error('تعذّر تحديث الدفع');
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, payment_status } : o)));
  };

  const removeOrder = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الطلب نهائياً؟')) return;
    const supabase = createClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return toast.error('تعذّر حذف الطلب');
    setOrders((p) => p.filter((o) => o.id !== id));
    toast.success('تم حذف الطلب');
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`تم نسخ ${code}`);
    } catch {
      toast.error('تعذّر النسخ');
    }
  };

  const filtered = orders.filter((o) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return o.code.toLowerCase().includes(q) || o.customer_phone.includes(q) || o.customer_name.includes(query.trim());
  });

  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('لا توجد طلبات للتصدير');
    const headers = ['كود الطلب', 'اسم الزبون', 'الهاتف', 'العنوان', 'الحالة', 'طريقة الدفع', 'حالة الدفع', 'المجموع', 'تاريخ الطلب'];
    const rows = filtered.map((o) => [
      o.code,
      o.customer_name,
      o.customer_phone,
      o.delivery_method === 'delivery' ? `${o.city} - ${o.address ?? ''}` : 'استلام من المطعم',
      ORDER_STATUS_LABELS[o.status],
      PAYMENT_METHOD_LABELS[o.payment_method],
      PAYMENT_STATUS_LABELS[o.payment_status],
      String(o.total),
      formatDateTime(o.created_at),
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = '﻿' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `orders-${Date.now()}.csv`);
    toast.success('تم تصدير CSV');
  };

  const exportJSON = () => {
    if (filtered.length === 0) return toast.error('لا توجد طلبات للتصدير');
    download(new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' }), `orders-${Date.now()}.json`);
    toast.success('تم تصدير JSON');
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة الطلبات"
        subtitle="عرض ومتابعة وتحديث حالات الطلبات"
        action={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-outline btn-sm"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={exportJSON} className="btn-outline btn-sm">JSON</button>
          </div>
        }
      />

      {/* أدوات */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالكود أو الهاتف أو الاسم"
              className="field pr-11"
            />
          </div>
          <div>
            <label className="field-label">من تاريخ</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field py-2.5" />
          </div>
          <div>
            <label className="field-label">إلى تاريخ</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field py-2.5" />
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>الكل</FilterChip>
          {ALL_STATUSES.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {ORDER_STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : filtered.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <span className="text-4xl">📭</span>
          <p className="mt-2 font-bold">لا توجد طلبات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isNew = o.status === 'received';
            return (
              <div key={o.id} className={cn('card overflow-hidden', isNew && 'ring-2 ring-brand-yellow')}>
                {/* رأس الطلب */}
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-right"
                  >
                    <ChevronDown className={cn('h-5 w-5 shrink-0 text-ink-muted transition', expanded === o.id && 'rotate-180')} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-extrabold text-ink">
                        {o.code} — {o.customer_name}
                        {isNew && <span className="badge-yellow">جديد</span>}
                      </p>
                      <p className="text-xs text-ink-muted">{formatDateTime(o.created_at)} · {o.city}</p>
                    </div>
                  </button>

                  <span className="font-black text-brand-red">{formatPrice(o.total)}</span>

                  <button onClick={() => copyCode(o.code)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-brand-red hover:text-white" title="نسخ رقم الطلب">
                    <Copy className="h-4 w-4" />
                  </button>

                  <select
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus, o.status)}
                    className="rounded-xl border-2 border-line bg-white px-3 py-2 text-sm font-bold focus:border-brand-red focus:outline-none"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                  </select>

                  <select
                    value={o.payment_status}
                    onChange={(e) => changePayment(o.id, e.target.value as PaymentStatus)}
                    className={cn(
                      'rounded-xl border-2 px-3 py-2 text-sm font-bold focus:outline-none',
                      o.payment_status === 'paid' ? 'border-green-300 bg-green-50 text-green-700'
                        : o.payment_status === 'awaiting_confirmation' ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-line bg-white text-ink',
                    )}
                    title="حالة الدفع"
                  >
                    {PAYMENT_STATUSES.map((p) => (
                      <option key={p} value={p}>{PAYMENT_STATUS_LABELS[p]}</option>
                    ))}
                  </select>

                  <Link href={`/invoice/${o.id}`} target="_blank" className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-brand-red hover:text-white" title="طباعة فاتورة">
                    <Printer className="h-4 w-4" />
                  </Link>
                  <button onClick={() => removeOrder(o.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-brand-red hover:text-white" title="حذف">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* التفاصيل */}
                {expanded === o.id && (
                  <div className="border-t border-line bg-cream/50 p-4 text-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-red" /> <span dir="ltr">{o.customer_phone}</span></p>
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                          <span>
                            {o.delivery_method === 'delivery'
                              ? `${o.city} — ${o.address ?? ''}${o.landmark ? ` (${o.landmark})` : ''}`
                              : 'استلام من المطعم'}
                          </span>
                        </p>
                        {o.latitude && o.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-brand-red hover:underline"
                          >
                            <MapPin className="h-4 w-4" /> فتح موقع الزبون على الخريطة
                          </a>
                        )}
                        {o.notes && <p className="text-ink-muted">ملاحظات: {o.notes}</p>}
                      </div>

                      <ul className="divide-y divide-line">
                        {o.items?.map((it) => (
                          <li key={it.id} className="flex justify-between py-1.5">
                            <span>
                              {it.product_name} {it.size_name ? `(${it.size_name})` : ''} × {it.quantity}
                              {it.addons.length > 0 && <span className="block text-xs text-ink-muted">+ {it.addons.map((a) => a.name).join('، ')}</span>}
                            </span>
                            <span className="font-bold">{formatPrice(it.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition',
        active ? 'bg-brand-red text-white shadow-card' : 'bg-white text-ink ring-1 ring-line hover:bg-ink/5',
      )}
    >
      {children}
    </button>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
