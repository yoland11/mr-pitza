'use client';

import { Loader2, Lock, Pizza } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) {
      setError('يجب ضبط Supabase أولاً (ملف .env.local) لتفعيل تسجيل الدخول.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('بيانات الدخول غير صحيحة');
        return;
      }
      router.replace(params.get('redirect') ?? '/admin');
      router.refresh();
    } catch {
      setError('تعذّر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-hero-glow p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-red shadow-card-hover">
            <Pizza className="h-9 w-9" />
          </span>
          <h1 className="mt-4 text-2xl font-black">لوحة إدارة مستر بيتزا</h1>
          <p className="text-sm text-white/70">سجّل دخولك للمتابعة</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              required
              className="field text-right"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="field-label">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="rounded-xl bg-brand-red/10 px-3 py-2 text-sm font-bold text-brand-red">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            تسجيل الدخول
          </button>

          {!isSupabaseConfigured && (
            <p className="text-center text-xs text-ink-muted">
              وضع المعاينة: اضبط Supabase في <code>.env.local</code> ثم نفّذ <code>supabase/schema.sql</code>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-hero-glow text-white">جارٍ التحميل...</div>}>
      <LoginForm />
    </Suspense>
  );
}
