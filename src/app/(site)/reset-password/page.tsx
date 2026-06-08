'use client';

import { KeyRound, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('كلمة المرور 6 أحرف على الأقل');
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error('تعذّر تحديث كلمة المرور — افتح الرابط من بريدك مجدداً');
        return;
      }
      toast.success('تم تحديث كلمة المرور');
      router.replace('/account');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-ink">كلمة مرور جديدة</h1>
          <div className="accent-bar mx-auto mt-3" />
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label">كلمة المرور الجديدة</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="field" />
          </div>
          <div>
            <label className="field-label">تأكيد كلمة المرور</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
            تحديث كلمة المرور
          </button>
        </form>
      </div>
    </div>
  );
}
