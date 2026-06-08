'use client';

import { Bike, CheckCircle2, LogOut, MapPin, MessageCircle, Phone, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@/lib/store/toast';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types';
import { cn, formatPrice, whatsappLink } from '@/lib/utils';

export interface DriverOrder {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  status: OrderStatus;
  total: number;
  items: { product_name: string; size_name: string | null; quantity: number }[];
}

export function DriverBoard({ driverName, orders }: { driverName: string; orders: DriverOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  // بثّ موقع السائق دورياً للتتبّع المباشر (أثناء وجود طلبات نشطة)
  useEffect(() => {
    if (orders.length === 0 || !('geolocation' in navigator)) return;
    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSharing(true);
          fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        },
        () => setSharing(false),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 },
      );
    };
    send();
    const id = setInterval(send, 20000);
    return () => clearInterval(id);
  }, [orders.length]);

  const setStatus = async (orderId: string, status: OrderStatus) => {
    setBusy(orderId);
    try {
      const res = await fetch('/api/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر التحديث');
        return;
      }
      toast.success('تم تحديث الحالة');
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const logout = async () => {
    await fetch('/api/driver/logout', { method: 'POST' });
    router.replace('/driver/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-red text-white"><Bike className="h-5 w-5" /></span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-ink">{driverName}</p>
            <p className="text-[11px] text-ink-muted">{orders.length} طلب مُسند{sharing ? ' · 📍 يُشارك الموقع' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.refresh()} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-brand-red hover:text-white"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={logout} className="btn-outline btn-sm"><LogOut className="h-4 w-4" /> خروج</button>
        </div>
      </header>

      <main className="container-page py-5">
        {orders.length === 0 ? (
          <div className="card grid place-items-center py-20 text-center text-ink-muted">
            <Bike className="h-10 w-10 text-brand-red" />
            <p className="mt-3 font-bold text-ink">لا توجد طلبات مُسندة حالياً</p>
            <p className="text-sm">سيظهر هنا أي طلب يُسند إليك.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((o) => {
              const maps = o.latitude && o.longitude
                ? `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.city} ${o.address ?? ''}`)}`;
              return (
                <div key={o.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-brand-red">{o.code}</span>
                    <span className="badge-soft">{ORDER_STATUS_LABELS[o.status]}</span>
                  </div>
                  <p className="mt-2 font-extrabold text-ink">{o.customer_name}</p>
                  <p className="flex items-start gap-1.5 text-sm text-ink-muted">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                    {o.city} — {o.address ?? ''}{o.landmark ? ` (${o.landmark})` : ''}
                  </p>

                  <ul className="mt-2 border-t border-line pt-2 text-sm text-ink">
                    {o.items.map((it, i) => (
                      <li key={i}>{it.product_name} {it.size_name ? `(${it.size_name})` : ''} × {it.quantity}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-bold text-ink">الإجمالي: <span className="text-brand-red">{formatPrice(o.total)}</span></p>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a href={`tel:${o.customer_phone}`} className="btn-outline btn-sm justify-center"><Phone className="h-4 w-4" /> اتصال</a>
                    <a href={whatsappLink(o.customer_phone, `مرحباً، أنا سائق مستر بيتزا بخصوص طلبك ${o.code}`)} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm justify-center"><MessageCircle className="h-4 w-4" /> واتساب</a>
                    <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm justify-center"><MapPin className="h-4 w-4" /> الموقع</a>
                  </div>

                  <div className="mt-2 flex gap-2">
                    {o.status !== 'on_the_way' && o.status !== 'delivered' && (
                      <button onClick={() => setStatus(o.id, 'on_the_way')} disabled={busy === o.id} className="btn-dark btn-sm flex-1"><Bike className="h-4 w-4" /> في الطريق</button>
                    )}
                    {o.status !== 'delivered' && (
                      <button onClick={() => setStatus(o.id, 'delivered')} disabled={busy === o.id} className={cn('btn-primary btn-sm flex-1')}><CheckCircle2 className="h-4 w-4" /> تم التسليم</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
