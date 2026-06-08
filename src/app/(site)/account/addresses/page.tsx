'use client';

import { Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { CustomerAddress } from '@/lib/types';
import { cn } from '@/lib/utils';

type Draft = Partial<CustomerAddress>;
const empty: Draft = { label: '', city: '', address: '', landmark: '', is_default: false };

export default function AddressesPage() {
  const [items, setItems] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('customer_addresses').select('*').eq('user_id', user.id).order('created_at');
    setItems((data as CustomerAddress[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft) return;
    if (!draft.city?.trim() || !draft.address?.trim()) return toast.error('المدينة والعنوان مطلوبان');
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id,
      label: draft.label || null,
      city: draft.city,
      address: draft.address,
      landmark: draft.landmark || null,
      is_default: draft.is_default ?? false,
    };
    // إن كان افتراضياً ألغِ الافتراضي عن البقية
    if (payload.is_default) {
      await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id);
    }
    const { error } = draft.id
      ? await supabase.from('customer_addresses').update(payload).eq('id', draft.id)
      : await supabase.from('customer_addresses').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ');
    toast.success('تم حفظ العنوان');
    setDraft(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا العنوان؟')) return;
    const supabase = createClient();
    await supabase.from('customer_addresses').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">عناويني</h2>
        {!draft && <button onClick={() => setDraft(empty)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> عنوان جديد</button>}
      </div>

      {draft && (
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink">{draft.id ? 'تعديل عنوان' : 'عنوان جديد'}</h3>
            <button onClick={() => setDraft(null)} className="text-ink-muted hover:text-brand-red"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="field-label">الاسم (المنزل/العمل)</label><input value={draft.label ?? ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="field" /></div>
            <div><label className="field-label">المدينة / القضاء</label><input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="field" /></div>
          </div>
          <div><label className="field-label">العنوان الكامل</label><input value={draft.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className="field" /></div>
          <div><label className="field-label">أقرب نقطة دالّة</label><input value={draft.landmark ?? ''} onChange={(e) => setDraft({ ...draft, landmark: e.target.value })} className="field" /></div>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={draft.is_default ?? false} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} className="h-5 w-5 accent-brand-red" /><span className="font-bold text-ink">تعيين كعنوان افتراضي</span></label>
          <button onClick={save} disabled={saving} className="btn-primary w-full sm:w-auto">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
        </div>
      )}

      {items.length === 0 && !draft ? (
        <div className="card grid place-items-center py-12 text-center text-ink-muted">
          <MapPin className="h-8 w-8 text-brand-red" />
          <p className="mt-2 font-bold">لا توجد عناوين محفوظة</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-red" />
                  <span className="font-extrabold text-ink">{a.label || 'عنوان'}</span>
                  {a.is_default && <span className="badge-yellow"><Star className="h-3 w-3" /> افتراضي</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setDraft(a)} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 hover:bg-brand-red hover:text-white"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(a.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink">{a.city} — {a.address}</p>
              {a.landmark && <p className="text-xs text-ink-muted">قرب: {a.landmark}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
