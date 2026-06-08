'use client';

import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';

export default function ProfilePage() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', birthday: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setForm({
        full_name: data?.full_name ?? user.user_metadata?.full_name ?? '',
        phone: data?.phone ?? '',
        email: data?.email ?? user.email ?? '',
        birthday: data?.birthday ?? '',
      });
      setLoading(false);
    })();
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (form.phone && !/^07\d{9}$/.test(form.phone)) return toast.error('رقم الهاتف غير صحيح');
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone || null,
      birthday: form.birthday || null,
    }).eq('id', user.id);
    setSaving(false);
    if (error) return toast.error('تعذّر حفظ البيانات');
    toast.success('تم حفظ بياناتك');
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>;

  return (
    <div className="card max-w-xl p-6">
      <h2 className="mb-4 text-lg font-extrabold text-ink">معلوماتي</h2>
      <div className="space-y-4">
        <div>
          <label className="field-label">الاسم الكامل</label>
          <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className="field" />
        </div>
        <div>
          <label className="field-label">رقم الهاتف</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" inputMode="tel" className="field text-right" placeholder="07XXXXXXXXX" />
        </div>
        <div>
          <label className="field-label">البريد الإلكتروني</label>
          <input value={form.email} dir="ltr" disabled className="field text-right opacity-70" />
        </div>
        <div>
          <label className="field-label">تاريخ الميلاد (لعروض عيد الميلاد 🎂)</label>
          <input type="date" value={form.birthday} onChange={(e) => set('birthday', e.target.value)} className="field" />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} حفظ التغييرات
        </button>
      </div>
    </div>
  );
}
