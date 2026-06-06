'use client';

import { ArrowLeft, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useCart } from '@/lib/store/cart';
import { toast } from '@/lib/store/toast';
import type { RestaurantSettings } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export function CartView({ settings }: { settings: RestaurantSettings }) {
  const { items, removeItem, updateQuantity, subtotal, couponCode, couponDiscount, setCoupon } =
    useCart();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);

  const sub = subtotal();
  const discount = couponDiscount;
  const deliveryFee = settings.delivery_fee;
  const total = Math.max(0, sub - discount) + deliveryFee;
  const belowMin = sub < settings.min_order;

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal: sub }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        toast.error(data.error ?? 'الكوبون غير صالح');
        return;
      }
      setCoupon(data.code, data.discount);
      toast.success(`تم تطبيق الكوبون — خصم ${formatPrice(data.discount)}`);
      setCode('');
    } catch {
      toast.error('تعذّر التحقق من الكوبون');
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="card mx-auto grid max-w-md place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-red/10 text-4xl">🛒</span>
        <h2 className="text-xl font-extrabold text-ink">سلتك فارغة</h2>
        <p className="text-sm text-ink-muted">أضف بعض الأطباق اللذيذة وابدأ طلبك الآن.</p>
        <Link href="/menu" className="btn-primary mt-2">
          <ShoppingBag className="h-5 w-5" />
          تصفّح المنيو
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* العناصر */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="card flex gap-3 p-3">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-line">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} fill sizes="96px" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-3xl">🍕</div>
              )}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold text-ink">{item.name}</h3>
                <button
                  onClick={() => {
                    removeItem(item.key);
                    toast.info('تم حذف المنتج من السلة');
                  }}
                  aria-label="حذف"
                  className="text-ink-muted transition hover:text-brand-red"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                {item.size && <p>الحجم: {item.size.name}</p>}
                {item.addons.length > 0 && <p>إضافات: {item.addons.map((a) => a.name).join('، ')}</p>}
                {item.notes && <p>ملاحظة: {item.notes}</p>}
              </div>

              <div className="mt-auto flex items-end justify-between pt-2">
                <QuantityStepper
                  size="sm"
                  value={item.quantity}
                  onChange={(v) => updateQuantity(item.key, v)}
                />
                <span className="font-extrabold text-brand-red">{formatPrice(item.lineTotal)}</span>
              </div>
            </div>
          </div>
        ))}

        <Link href="/menu" className="inline-flex items-center gap-1 text-sm font-bold text-brand-red hover:text-brand-red-dark">
          <ArrowLeft className="h-4 w-4" />
          أضف المزيد من المنيو
        </Link>
      </div>

      {/* الملخص */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h2 className="text-lg font-extrabold text-ink">ملخص الطلب</h2>

          {/* كوبون */}
          <div className="mt-4">
            {couponCode ? (
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 font-bold text-green-700">
                  <Tag className="h-4 w-4" /> {couponCode}
                </span>
                <button
                  onClick={() => setCoupon(null, 0)}
                  className="text-green-700 hover:text-brand-red"
                  aria-label="إزالة الكوبون"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="كود الخصم"
                  className="field py-2.5"
                />
                <button onClick={applyCoupon} disabled={applying} className="btn-dark btn-sm shrink-0">
                  {applying ? '...' : 'تطبيق'}
                </button>
              </div>
            )}
          </div>

          {/* الحساب */}
          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">السعر الفرعي</dt>
              <dd className="font-bold text-ink">{formatPrice(sub)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>الخصم</dt>
                <dd className="font-bold">- {formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-muted">رسوم التوصيل</dt>
              <dd className="font-bold text-ink">{formatPrice(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-extrabold text-ink">المجموع الكلي</dt>
              <dd className="text-xl font-black text-brand-red">{formatPrice(total)}</dd>
            </div>
          </dl>

          {belowMin && (
            <p className="mt-3 rounded-xl bg-brand-yellow/15 px-3 py-2 text-xs font-bold text-brand-yellow-dark">
              الحد الأدنى للطلب {formatPrice(settings.min_order)} — أضف المزيد للمتابعة.
            </p>
          )}

          <Link
            href="/checkout"
            aria-disabled={belowMin}
            className={`btn-primary mt-4 w-full ${belowMin ? 'pointer-events-none opacity-50' : ''}`}
          >
            إتمام الطلب
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="mt-2 text-center text-xs text-ink-muted">
            رسوم التوصيل تُحتسب داخل المدينة / القضاء فقط
          </p>
        </div>
      </aside>
    </div>
  );
}
