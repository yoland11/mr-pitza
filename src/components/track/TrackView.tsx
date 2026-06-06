'use client';

import {
  Bell,
  CheckCircle2,
  ChefHat,
  Flame,
  PackageCheck,
  Bike,
  Home,
  Loader2,
  Search,
  Send,
  Star,
  XCircle,
  Receipt,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/store/toast';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/types';
import { cn, formatDateTime, formatPrice } from '@/lib/utils';

interface TrackedOrder {
  code: string;
  status: OrderStatus;
  customer_name: string;
  delivery_method: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
  city: string;
  reviewed?: boolean;
  items?: { product_name: string; size_name: string | null; quantity: number; line_total: number }[];
}

const STATUS_ICONS: Record<OrderStatus, typeof CheckCircle2> = {
  received: CheckCircle2,
  preparing: ChefHat,
  in_oven: Flame,
  ready: PackageCheck,
  on_the_way: Bike,
  delivered: Home,
  cancelled: XCircle,
};

const TERMINAL: OrderStatus[] = ['delivered', 'cancelled'];

function notify(title: string, body: string) {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, { body, icon: '/icon.svg' })).catch(() => {
          new Notification(title, { body, icon: '/icon.svg' });
        });
      } else {
        new Notification(title, { body, icon: '/icon.svg' });
      }
      return;
    } catch {
      /* fallback */
    }
  }
  toast.info(`${title} — ${body}`);
}

export function TrackView() {
  const params = useSearchParams();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifOn, setNotifOn] = useState(false);
  const lastStatus = useRef<OrderStatus | null>(null);

  const search = async (q: { phone?: string; code?: string }, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
      setOrder(null);
    }
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (!silent) setError(data.error ?? 'لم يتم العثور على الطلب');
        return;
      }
      // إشعار عند تغيّر الحالة أثناء المتابعة الصامتة
      if (silent && order && data.order.status !== lastStatus.current) {
        notify('تحديث طلبك 🍕', `حالة طلبك ${data.order.code}: ${ORDER_STATUS_LABELS[data.order.status as OrderStatus]}`);
      }
      lastStatus.current = data.order.status;
      setOrder(data.order);
    } catch {
      if (!silent) setError('تعذّر الاتصال، حاول مرة أخرى');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // بحث تلقائي عند وجود كود في الرابط
  useEffect(() => {
    const urlCode = params.get('code');
    if (urlCode) {
      setCode(urlCode);
      search({ code: urlCode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // متابعة الحالة كل 15 ثانية بعد تفعيل الإشعارات
  useEffect(() => {
    if (!order || !notifOn) return;
    if (TERMINAL.includes(order.status)) return;
    const id = setInterval(() => search({ code: order.code }, true), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.code, notifOn, order?.status]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('متصفحك لا يدعم الإشعارات');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      toast.error('لم يتم السماح بالإشعارات');
      return;
    }
    setNotifOn(true);
    toast.success('تم تفعيل إشعارات الطلب');
    lastStatus.current = order?.status ?? null;
    // محاولة اشتراك Push إن توفّر مفتاح VAPID (اختياري)
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapid && 'serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
        });
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: order?.code ?? '', endpoint: sub.endpoint, subscription: sub }),
        });
      }
    } catch {
      /* الإشعارات المحلية تكفي كبديل */
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() && !code.trim()) {
      setError('أدخل رقم الهاتف أو كود الطلب');
      return;
    }
    search({ phone: phone.trim() || undefined, code: code.trim() || undefined });
  };

  const currentIndex = order ? ORDER_STATUS_FLOW.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="mx-auto max-w-2xl">
      {/* نموذج البحث */}
      <form onSubmit={onSubmit} className="card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">كود الطلب</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="field" placeholder="MP-XXXXX" dir="ltr" />
          </div>
          <div>
            <label className="field-label">أو رقم الهاتف</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field text-right" placeholder="07XXXXXXXXX" dir="ltr" inputMode="tel" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          تتبّع الطلب
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-brand-red/10 p-4 text-sm font-bold text-brand-red">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* نتيجة التتبّع */}
      {order && (
        <div className="mt-6 space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">كود الطلب</p>
                <p className="text-2xl font-black tracking-widest text-brand-red">{order.code}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-ink-muted">{formatDateTime(order.created_at)}</p>
                <p className="font-extrabold text-ink">{formatPrice(order.total)}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-ink-muted">مرحباً {order.customer_name} — {order.city}</p>

            {/* تفعيل الإشعارات */}
            {!TERMINAL.includes(order.status) && (
              <button
                onClick={enableNotifications}
                disabled={notifOn}
                className={cn('btn-outline btn-sm mt-3 w-full', notifOn && 'border-green-500 text-green-600')}
              >
                <Bell className="h-4 w-4" />
                {notifOn ? 'الإشعارات مفعّلة — سننبهك عند تغيّر الحالة' : 'تفعيل إشعارات الطلب'}
              </button>
            )}
          </div>

          {/* الحالة */}
          {isCancelled ? (
            <div className="card flex items-center gap-3 border-2 border-brand-red/30 p-5">
              <XCircle className="h-8 w-8 text-brand-red" />
              <div>
                <p className="text-lg font-extrabold text-brand-red">تم إلغاء الطلب</p>
                <p className="text-sm text-ink-muted">للاستفسار يرجى التواصل مع المطعم.</p>
              </div>
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="mb-5 text-lg font-extrabold text-ink">حالة الطلب</h3>
              <ol className="relative space-y-1">
                {ORDER_STATUS_FLOW.map((status, idx) => {
                  const Icon = STATUS_ICONS[status];
                  const done = idx <= currentIndex;
                  const active = idx === currentIndex;
                  return (
                    <li key={status} className="flex items-center gap-4 py-2">
                      <div className="relative flex flex-col items-center">
                        <span className={cn('grid h-11 w-11 place-items-center rounded-full transition', done ? 'bg-brand-red text-white' : 'bg-ink/5 text-ink-muted', active && 'ring-4 ring-brand-red/20')}>
                          <Icon className="h-5 w-5" />
                        </span>
                        {idx < ORDER_STATUS_FLOW.length - 1 && (
                          <span className={cn('absolute top-11 h-7 w-0.5', idx < currentIndex ? 'bg-brand-red' : 'bg-line')} />
                        )}
                      </div>
                      <span className={cn('font-bold', done ? 'text-ink' : 'text-ink-muted')}>
                        {ORDER_STATUS_LABELS[status]}
                        {active && <span className="mr-2 text-xs font-bold text-brand-red">● الآن</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* عناصر الطلب */}
          {order.items && order.items.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-ink">
                <Receipt className="h-5 w-5 text-brand-red" /> تفاصيل الطلب
              </h3>
              <ul className="divide-y divide-line text-sm">
                {order.items.map((it, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span className="text-ink">{it.product_name} {it.size_name ? `(${it.size_name})` : ''} × {it.quantity}</span>
                    <span className="font-bold text-ink">{formatPrice(it.line_total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* تقييم الطلب بعد التسليم */}
          {order.status === 'delivered' && (
            <ReviewBox code={order.code} alreadyReviewed={!!order.reviewed} defaultName={order.customer_name} />
          )}
        </div>
      )}
    </div>
  );
}

function ReviewBox({ code, alreadyReviewed, defaultName }: { code: string; alreadyReviewed: boolean; defaultName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyReviewed);

  if (done) {
    return (
      <div className="card flex items-center gap-3 p-5">
        <CheckCircle2 className="h-7 w-7 text-green-600" />
        <p className="font-bold text-ink">شكراً لتقييمك! نعتزّ برأيك 🍕</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return toast.error('اختر عدد النجوم');
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, rating, comment, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر إرسال التقييم');
        return;
      }
      setDone(true);
      toast.success('تم إرسال تقييمك، شكراً لك!');
    } catch {
      toast.error('تعذّر الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5">
      <h3 className="text-lg font-extrabold text-ink">قيّم تجربتك</h3>
      <p className="mt-1 text-sm text-ink-muted">رأيك يساعدنا على التحسّن.</p>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} نجوم`}
          >
            <Star className={cn('h-8 w-8 transition', (hover || rating) >= n ? 'fill-brand-yellow text-brand-yellow' : 'text-line')} />
          </button>
        ))}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} className="field mt-3" placeholder="اسمك (اختياري)" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={400} className="field mt-3 resize-none" placeholder="اكتب تعليقك (اختياري)" />
      <button type="submit" disabled={submitting} className="btn-primary mt-3 w-full">
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        إرسال التقييم
      </button>
    </form>
  );
}

/** تحويل مفتاح VAPID إلى Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
