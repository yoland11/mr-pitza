'use client';

import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { toast } from '@/lib/store/toast';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return toast.error('يجب ضبط Supabase أولاً');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error('بيانات الدخول غير صحيحة');
        return;
      }
      toast.success('تم تسجيل الدخول');
      router.replace(redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-ink">تسجيل الدخول</h1>
          <p className="mt-2 text-ink-muted">أهلاً بعودتك إلى مستر بيتزا 🍕</p>
          <div className="accent-bar mx-auto mt-3" />
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <GoogleSignInButton redirect={redirect} />
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" /> أو <span className="h-px flex-1 bg-line" />
          </div>
          <div>
            <label className="field-label">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required className="field text-right" placeholder="you@example.com" />
          </div>
          <div>
            <label className="field-label">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="field" placeholder="••••••••" />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-bold text-brand-red hover:underline">نسيت كلمة المرور؟</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            دخول
          </button>
          <p className="text-center text-sm text-ink-muted">
            ليس لديك حساب؟{' '}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-brand-red hover:underline">أنشئ حساباً</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-ink-muted">جارٍ التحميل...</div>}>
      <LoginForm />
    </Suspense>
  );
}
