'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Navigation,
  Store,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { useCart } from '@/lib/store/cart';
import { toast } from '@/lib/store/toast';
import type { DeliveryMethod, PaymentMethod, RestaurantSettings } from '@/lib/types';
import { checkoutFormSchema, type CheckoutFormInput } from '@/lib/validation';
import { cn, formatPrice } from '@/lib/utils';

const OUTSIDE = '__outside__';

export function CheckoutForm({ settings }: { settings: RestaurantSettings }) {
  const { items, subtotal, couponCode, couponDiscount, clear } = useCart();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ code: string; id: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // جلب هوية العميل المسجّل (لربط الطلب وكسب النقاط)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      const { data: { user } } = await createClient().auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryMethod: 'delivery',
      paymentMethod: 'cash',
      city: settings.delivery_zones[0] ?? settings.city,
      customerName: '',
      customerPhone: '',
      address: '',
      landmark: '',
      notes: '',
    },
  });

  const deliveryMethod = watch('deliveryMethod');
  const city = watch('city');
  const paymentMethod = watch('paymentMethod');
  const outsideZone = deliveryMethod === 'delivery' && city === OUTSIDE;

  const sub = subtotal();
  const discount = couponDiscount;
  const deliveryFee = deliveryMethod === 'delivery' ? settings.delivery_fee : 0;
  const total = Math.max(0, sub - discount) + deliveryFee;

  const captureGPS = () => {
    if (!('geolocation' in navigator)) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success('تم تحديد موقعك بنجاح');
      },
      () => {
        setGpsLoading(false);
        toast.error('تعذّر تحديد الموقع، تأكد من السماح بالوصول');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSubmit = async (form: CheckoutFormInput) => {
    if (items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    if (outsideZone) {
      toast.error('عذراً، التوصيل متوفر فقط داخل المدينة أو القضاء');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        city: deliveryMethod === 'pickup' ? settings.city : form.city,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        couponCode: couponCode ?? null,
        userId: userId ?? null,
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          sizeName: it.size?.name ?? null,
          addons: it.addons.map((a) => ({ name: a.name, price: a.price })),
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          notes: it.notes,
        })),
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر إرسال الطلب');
        return;
      }
      clear();
      setSuccess({ code: data.code, id: data.id });
      toast.success('تم إرسال طلبك بنجاح!');
    } catch {
      toast.error('حدث خطأ في الاتصال، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </span>
        <h2 className="mt-5 text-2xl font-black text-ink">تم استلام طلبك! 🎉</h2>
        <p className="mt-2 text-ink-muted">سنبدأ بتحضيره فوراً. احتفظ بكود الطلب لمتابعته.</p>
        <div className="mt-5 rounded-2xl bg-cream p-4">
          <p className="text-sm text-ink-muted">كود الطلب</p>
          <p className="text-3xl font-black tracking-widest text-brand-red">{success.code}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href={`/track?code=${success.code}`} className="btn-primary flex-1">
            تتبّع الطلب
          </Link>
          <Link href={`/invoice/${success.id}`} className="btn-outline flex-1">
            عرض الفاتورة
          </Link>
        </div>
        <Link href="/menu" className="mt-3 inline-block text-sm font-bold text-brand-red hover:underline">
          العودة للمنيو
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card mx-auto grid max-w-md place-items-center gap-3 py-16 text-center">
        <span className="text-5xl">🛒</span>
        <p className="text-lg font-bold text-ink">سلتك فارغة</p>
        <Link href="/menu" className="btn-primary mt-2">تصفّح المنيو</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* بيانات الزبون */}
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold text-ink">بيانات الزبون</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">الاسم الكامل</label>
              <input {...register('customerName')} className="field" placeholder="مثال: أحمد علي" />
              {errors.customerName && <p className="field-error">{errors.customerName.message}</p>}
            </div>
            <div>
              <label className="field-label">رقم الهاتف</label>
              <input {...register('customerPhone')} dir="ltr" inputMode="tel" className="field text-right" placeholder="07XXXXXXXXX" />
              {errors.customerPhone && <p className="field-error">{errors.customerPhone.message}</p>}
            </div>
          </div>
        </section>

        {/* طريقة الاستلام */}
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold text-ink">طريقة الاستلام</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: 'delivery', label: 'توصيل', desc: 'داخل المدينة / القضاء', Icon: Truck },
              { v: 'pickup', label: 'استلام من المطعم', desc: settings.address, Icon: Store },
            ] as { v: DeliveryMethod; label: string; desc: string; Icon: typeof Truck }[]).map(
              ({ v, label, desc, Icon }) => (
                <label
                  key={v}
                  className={cn(
                    'cursor-pointer rounded-2xl border-2 p-4 transition',
                    deliveryMethod === v ? 'border-brand-red bg-brand-red/5 shadow-glow' : 'border-line hover:border-brand-red/40',
                  )}
                >
                  <input type="radio" value={v} {...register('deliveryMethod')} className="sr-only" />
                  <Icon className={cn('h-6 w-6', deliveryMethod === v ? 'text-brand-red' : 'text-ink-muted')} />
                  <p className="mt-2 font-extrabold text-ink">{label}</p>
                  <p className="line-clamp-1 text-xs text-ink-muted">{desc}</p>
                </label>
              ),
            )}
          </div>

          {/* تفاصيل التوصيل */}
          {deliveryMethod === 'delivery' ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="field-label">المدينة / القضاء</label>
                <select {...register('city')} className="field">
                  {settings.delivery_zones.map((z) => (
                    <option key={z} value={z}>{settings.city} — {z}</option>
                  ))}
                  <option value={OUTSIDE}>منطقة أخرى / خارج المدينة</option>
                </select>
              </div>

              {outsideZone && (
                <div className="flex items-start gap-2 rounded-2xl bg-brand-red/10 p-4 text-sm font-bold text-brand-red">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  عذراً، التوصيل متوفر فقط داخل المدينة أو القضاء.
                </div>
              )}

              <div>
                <label className="field-label">العنوان الكامل داخل المدينة / القضاء</label>
                <input {...register('address')} className="field" placeholder="الحي، الشارع، رقم المنزل" />
                {errors.address && <p className="field-error">{errors.address.message}</p>}
              </div>
              <div>
                <label className="field-label">أقرب نقطة دالّة (اختياري)</label>
                <input {...register('landmark')} className="field" placeholder="مثال: قرب الصيدلية، مقابل الجامع" />
              </div>

              <button
                type="button"
                onClick={captureGPS}
                className={cn('btn-outline w-full', coords && 'border-green-500 text-green-600')}
              >
                {gpsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : coords ? <CheckCircle2 className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
                {coords ? 'تم تحديد موقعك (اختياري)' : 'تحديد موقعي عبر GPS (اختياري)'}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-cream p-4 text-sm text-ink">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <span>استلم طلبك من فرعنا: {settings.address} — {settings.city}</span>
            </div>
          )}
        </section>

        {/* طريقة الدفع */}
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold text-ink">طريقة الدفع</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: 'cash', label: 'كاش', desc: 'عند الاستلام', Icon: Banknote },
              { v: 'card', label: 'بطاقة / ماستر', desc: 'دفع إلكتروني', Icon: CreditCard },
            ] as { v: PaymentMethod; label: string; desc: string; Icon: typeof Banknote }[]).map(
              ({ v, label, desc, Icon }) => (
                <label
                  key={v}
                  className={cn(
                    'cursor-pointer rounded-2xl border-2 p-4 transition',
                    paymentMethod === v ? 'border-brand-red bg-brand-red/5 shadow-glow' : 'border-line hover:border-brand-red/40',
                  )}
                >
                  <input type="radio" value={v} {...register('paymentMethod')} className="sr-only" />
                  <Icon className={cn('h-6 w-6', paymentMethod === v ? 'text-brand-red' : 'text-ink-muted')} />
                  <p className="mt-2 font-extrabold text-ink">{label}</p>
                  <p className="text-xs text-ink-muted">{desc}</p>
                </label>
              ),
            )}
          </div>

          {/* دفع QR للبطاقة / ماستر كارد */}
          {paymentMethod === 'card' && (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-red/30 bg-cream p-4 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-ink">
                <QrCode className="h-5 w-5 text-brand-red" />
                ادفع عبر مسح رمز QR ثم أكمل الطلب
              </p>
              {settings.qr_payment_image_url ? (
                <div className="relative mx-auto mt-3 aspect-square w-44 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  <Image src={settings.qr_payment_image_url} alt="رمز الدفع QR" fill sizes="176px" className="object-contain p-2" />
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-muted">سيتواصل معك المطعم لإتمام الدفع بالبطاقة.</p>
              )}
              <p className="mt-3 text-xs text-ink-muted">سيظهر طلبك بحالة «بانتظار تأكيد الدفع» حتى يؤكّده المطعم.</p>
            </div>
          )}
        </section>

        {/* ملاحظات */}
        <section className="card p-5">
          <label className="field-label">ملاحظات الطلب (اختياري)</label>
          <textarea {...register('notes')} rows={3} className="field resize-none" placeholder="أي تعليمات إضافية لطلبك..." />
        </section>
      </div>

      {/* الملخص */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h2 className="text-lg font-extrabold text-ink">ملخص الطلب</h2>
          <ul className="mt-3 max-h-52 space-y-2 overflow-auto text-sm">
            {items.map((it) => (
              <li key={it.key} className="flex justify-between gap-2">
                <span className="text-ink">
                  {it.name} {it.size ? `(${it.size.name})` : ''} × {it.quantity}
                </span>
                <span className="shrink-0 font-bold text-ink">{formatPrice(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">السعر الفرعي</dt>
              <dd className="font-bold text-ink">{formatPrice(sub)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>الخصم {couponCode ? `(${couponCode})` : ''}</dt>
                <dd className="font-bold">- {formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-muted">رسوم التوصيل</dt>
              <dd className="font-bold text-ink">{deliveryFee > 0 ? formatPrice(deliveryFee) : 'مجاناً (استلام)'}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="font-extrabold text-ink">المجموع الكلي</dt>
              <dd className="text-xl font-black text-brand-red">{formatPrice(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={submitting || outsideZone}
            className="btn-primary mt-5 w-full"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تأكيد الطلب'}
          </button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            بالضغط على تأكيد الطلب فإنك توافق على شروط الطلب والتوصيل.
          </p>
        </div>
      </aside>
    </form>
  );
}
