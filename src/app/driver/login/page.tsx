'use client';

import { Loader2, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/lib/store/toast';

export default function DriverLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر تسجيل الدخول');
        return;
      }
      router.replace('/driver');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-hero-glow p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-red shadow-card-hover">
            <Truck className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-2xl font-black">تطبيق السائق</h1>
          <p className="text-sm text-white/70">سجّل دخولك لعرض طلباتك</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label">رقم الهاتف</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" inputMode="tel" required className="field text-right" placeholder="07XXXXXXXXX" />
          </div>
          <div>
            <label className="field-label">رمز الدخول</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" required className="field text-right" placeholder="****" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
            دخول
          </button>
          <p className="text-center text-xs text-ink-muted">احصل على رمز الدخول من إدارة المطعم.</p>
        </form>
      </div>
    </div>
  );
}
