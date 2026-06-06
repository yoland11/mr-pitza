'use client';

import { Check, Copy, Ticket } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/store/toast';
import type { Coupon } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/utils';

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('تم نسخ كود الخصم');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('تعذّر النسخ');
    }
  };

  return (
    <div className="card relative flex items-center gap-4 overflow-hidden p-5">
      {/* قص جانبي زخرفي */}
      <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-cream" />
      <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-cream" />

      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-red text-white">
        <Ticket className="h-7 w-7" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-brand-red">{coupon.discount_percent}%</span>
          <span className="badge-yellow">خصم</span>
        </div>
        {coupon.description && <p className="mt-1 text-sm text-ink-muted">{coupon.description}</p>}
        <p className="mt-1 text-xs text-ink-muted">
          حد أدنى {formatPrice(coupon.min_order)}
          {coupon.expires_at ? ` — ينتهي ${formatDate(coupon.expires_at)}` : ''}
        </p>
      </div>
      <button
        onClick={copy}
        className="flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 border-dashed border-brand-red/40 px-3 py-2 transition hover:bg-brand-red/5"
      >
        <span className="font-mono text-sm font-extrabold tracking-wider text-ink">{coupon.code}</span>
        <span className="flex items-center gap-1 text-xs font-bold text-brand-red">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </span>
      </button>
    </div>
  );
}
