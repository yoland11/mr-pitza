'use client';

import { Printer, Receipt, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type Order,
  type RestaurantSettings,
} from '@/lib/types';
import { cn, formatDateTime, formatPrice } from '@/lib/utils';

export function InvoiceView({ order, settings }: { order: Order; settings: RestaurantSettings }) {
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4');
  const thermal = format === 'thermal';
  const paid = order.payment_status === 'paid';

  const siteUrl =
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    '';
  const trackUrl = `${siteUrl}/track?code=${order.code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=0&data=${encodeURIComponent(trackUrl)}`;

  return (
    <div className="container-page py-8">
      {/* حجم صفحة الطباعة حسب الوضع (لا يؤثر على الشاشة) */}
      <style>{thermal ? '@page{size:80mm auto;margin:3mm}' : '@page{size:A4;margin:14mm}'}</style>
      {/* شريط التحكم — لا يُطبع */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-brand-red hover:underline">
          <ArrowRight className="h-4 w-4" /> الرئيسية
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-ink/5 p-1">
            <button
              onClick={() => setFormat('a4')}
              className={cn('flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition', !thermal ? 'bg-brand-red text-white' : 'text-ink')}
            >
              <FileText className="h-4 w-4" /> A4
            </button>
            <button
              onClick={() => setFormat('thermal')}
              className={cn('flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition', thermal ? 'bg-brand-red text-white' : 'text-ink')}
            >
              <Receipt className="h-4 w-4" /> حراري 80mm
            </button>
          </div>
          <button onClick={() => window.print()} className="btn-primary btn-sm">
            <Printer className="h-4 w-4" /> طباعة / PDF
          </button>
        </div>
      </div>

      {/* الفاتورة */}
      <div
        className={cn(
          'print-area mx-auto bg-white text-ink shadow-card',
          thermal
            ? 'max-w-[320px] p-4 text-[13px] leading-tight print:w-[80mm] print:max-w-none print:p-1.5 print:text-[12px] print:shadow-none'
            : 'max-w-2xl rounded-2xl p-8',
        )}
      >
        {/* الترويسة */}
        <div className={cn('flex items-center gap-3 border-b-2 border-dashed border-ink/20 pb-4', thermal && 'flex-col text-center')}>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-red text-2xl text-white">🍕</div>
          <div className={cn(thermal && 'text-center')}>
            <h1 className="text-xl font-black text-brand-red">{settings.name}</h1>
            <p className="text-xs text-ink-muted">{settings.address} — {settings.city}</p>
            <p dir="ltr" className="text-xs text-ink-muted">{settings.phone}</p>
          </div>
        </div>

        {/* بيانات الطلب */}
        <div className={cn('mt-4 grid gap-1 text-sm', !thermal && 'grid-cols-2')}>
          <div className="flex justify-between gap-2">
            <span className="text-ink-muted">رقم الطلب:</span>
            <span className="font-extrabold">{order.code}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-ink-muted">التاريخ:</span>
            <span className="font-bold">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-ink-muted">الزبون:</span>
            <span className="font-bold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-ink-muted">الهاتف:</span>
            <span dir="ltr" className="font-bold">{order.customer_phone}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-ink-muted">الاستلام:</span>
            <span className="font-bold">{DELIVERY_METHOD_LABELS[order.delivery_method]}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-ink-muted">الحالة:</span>
            <span className="font-bold">{ORDER_STATUS_LABELS[order.status]}</span>
          </div>
          {order.delivery_method === 'delivery' && order.address && (
            <div className="col-span-2 flex justify-between gap-2">
              <span className="text-ink-muted">العنوان:</span>
              <span className="font-bold">{order.city} — {order.address}{order.landmark ? ` (${order.landmark})` : ''}</span>
            </div>
          )}
        </div>

        {/* العناصر */}
        <table className="mt-4 w-full border-t-2 border-dashed border-ink/20 text-sm">
          <thead>
            <tr className="text-ink-muted">
              <th className="py-2 text-right font-bold">الصنف</th>
              <th className="py-2 text-center font-bold">كمية</th>
              <th className="py-2 text-left font-bold">السعر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-ink/10">
            {order.items?.map((it) => (
              <tr key={it.id}>
                <td className="py-2 text-right">
                  <span className="font-bold">{it.product_name}</span>
                  {it.size_name && <span className="text-xs text-ink-muted"> — {it.size_name}</span>}
                  {it.addons.length > 0 && (
                    <span className="block text-xs text-ink-muted">+ {it.addons.map((a) => a.name).join('، ')}</span>
                  )}
                </td>
                <td className="py-2 text-center tabular-nums">{it.quantity}</td>
                <td className="py-2 text-left tabular-nums font-bold">{formatPrice(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* المجاميع */}
        <div className="mt-3 space-y-1 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
          <Row label="السعر الفرعي" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && <Row label={`الخصم${order.coupon_code ? ` (${order.coupon_code})` : ''}`} value={`- ${formatPrice(order.discount)}`} />}
          <Row label="رسوم التوصيل" value={order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : 'مجاناً'} />
          <div className="flex justify-between border-t border-ink/20 pt-2 text-base">
            <span className="font-extrabold">المجموع النهائي</span>
            <span className="font-black text-brand-red">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* الدفع */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
          <span>طريقة الدفع: <strong>{PAYMENT_METHOD_LABELS[order.payment_method]}</strong></span>
          <span className={cn('badge', paid ? 'badge-yellow' : order.payment_status === 'awaiting_confirmation' ? 'bg-amber-100 text-amber-700' : 'badge-red')}>
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </span>
        </div>

        {order.notes && <p className="mt-3 text-xs text-ink-muted">ملاحظات: {order.notes}</p>}

        {/* تذييل */}
        <div className="mt-5 border-t-2 border-dashed border-ink/20 pt-4 text-center">
          {/* QR لتتبّع الطلب (للفاتورة الحرارية) */}
          {thermal && (
            <div className="mb-3 flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR تتبّع الطلب" width={96} height={96} className="h-24 w-24" />
              <span className="text-[11px] text-ink-muted">امسح لتتبّع طلبك</span>
            </div>
          )}
          <p className="text-sm font-extrabold text-brand-red">شكراً لاختياركم مستر بيتزا 🍕</p>
          <p className="mt-1 text-xs text-ink-muted">نتمنى لكم وجبة شهية — {settings.working_hours}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
