'use client';

import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { toast } from '@/lib/store/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return toast.error('يجب ضبط Supabase أولاً');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error('تعذّر إرسال رابط الاستعادة');
        return;
      }
      setSent(true);
      toast.success('تم إرسال رابط الاستعادة إلى بريدك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-ink">استعادة كلمة المرور</h1>
          <div className="accent-bar mx-auto mt-3" />
        </div>
        {sent ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600"><Mail className="h-8 w-8" /></span>
            <p className="mt-4 font-bold text-ink">تحقّق من بريدك الإلكتروني</p>
            <p className="mt-1 text-sm text-ink-muted">أرسلنا رابطاً لإعادة تعيين كلمة المرور.</p>
            <Link href="/login" className="btn-primary mt-5">العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4 p-6">
            <p className="text-sm text-ink-muted">أدخل بريدك وسنرسل لك رابط إعادة التعيين.</p>
            <div>
              <label className="field-label">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required className="field text-right" placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
              إرسال الرابط
            </button>
            <p className="text-center text-sm"><Link href="/login" className="font-bold text-brand-red hover:underline">العودة لتسجيل الدخول</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
