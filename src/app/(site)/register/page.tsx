'use client';

import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { toast } from '@/lib/store/toast';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/account';
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return toast.error('يجب ضبط Supabase أولاً');
    if (form.password.length < 6) return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (!/^07\d{9}$/.test(form.phone)) return toast.error('رقم الهاتف غير صحيح (07XXXXXXXXX)');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name, phone: form.phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message.includes('registered') ? 'البريد مسجّل مسبقاً' : 'تعذّر إنشاء الحساب');
        return;
      }
      if (data.session) {
        toast.success('تم إنشاء حسابك بنجاح 🎉');
        router.replace(redirect);
        router.refresh();
      } else {
        toast.success('تم إنشاء الحساب — تحقّق من بريدك لتفعيله');
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-ink">إنشاء حساب</h1>
          <p className="mt-2 text-ink-muted">انضم واجمع نقاطك مع كل طلب 🍕</p>
          <div className="accent-bar mx-auto mt-3" />
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <GoogleSignInButton redirect={redirect} />
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" /> أو <span className="h-px flex-1 bg-line" />
          </div>
          <div>
            <label className="field-label">الاسم الكامل</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="field" placeholder="أحمد علي" />
          </div>
          <div>
            <label className="field-label">رقم الهاتف</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" inputMode="tel" required className="field text-right" placeholder="07XXXXXXXXX" />
          </div>
          <div>
            <label className="field-label">البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} dir="ltr" required className="field text-right" placeholder="you@example.com" />
          </div>
          <div>
            <label className="field-label">كلمة المرور</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required className="field" placeholder="6 أحرف على الأقل" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
            إنشاء الحساب
          </button>
          <p className="text-center text-sm text-ink-muted">
            لديك حساب؟{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-bold text-brand-red hover:underline">تسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-ink-muted">جارٍ التحميل...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
