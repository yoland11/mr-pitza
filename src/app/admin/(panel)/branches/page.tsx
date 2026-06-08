'use client';

import { Building2, Loader2, MapPin, Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Branch } from '@/lib/types';
import { cn } from '@/lib/utils';

type Draft = Partial<Branch>;
const empty: Draft = { name: '', phone: '', address: '', city: '', is_active: true, is_main: false };

export default function BranchesPage() {
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('branches').select('*').order('created_at');
    setItems((data as Branch[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft?.name?.trim()) return toast.error('اسم الفرع مطلوب');
    setSaving(true);
    const supabase = createClient();
    if (draft.is_main) await supabase.from('branches').update({ is_main: false }).neq('id', draft.id ?? '00000000-0000-0000-0000-000000000000');
    const payload = { name: draft.name, phone: draft.phone || null, address: draft.address || null, city: draft.city || null, is_active: draft.is_active ?? true, is_main: draft.is_main ?? false };
    const { error } = draft.id ? await supabase.from('branches').update(payload).eq('id', draft.id) : await supabase.from('branches').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ — تحقّق من صلاحيتك (مالك/مدير)');
    toast.success('تم الحفظ');
    setDraft(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا الفرع؟ (الطلبات المرتبطة ستبقى بلا فرع)')) return;
    const supabase = createClient();
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) return toast.error('تعذّر الحذف');
    setItems((p) => p.filter((x) => x.id !== id));
  };

  return (
    <>
      <AdminPageHeader
        title="الفروع"
        subtitle="إدارة فروع المطعم (تعدّد الفروع)"
        action={<button onClick={() => setDraft(empty)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> فرع جديد</button>}
      />

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : items.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted"><Building2 className="h-9 w-9 text-brand-red" /><p className="mt-2 font-bold text-ink">لا توجد فروع — أضف فرعك الأول</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red/10 text-brand-red"><Building2 className="h-5 w-5" /></span>
                  <div><p className="font-extrabold text-ink">{b.name}</p>{b.city && <p className="text-xs text-ink-muted">{b.city}</p>}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {b.is_main && <span className="badge-yellow"><Star className="h-3 w-3" /> رئيسي</span>}
                  {!b.is_active && <span className="badge-soft">معطّل</span>}
                </div>
              </div>
              {b.phone && <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted" dir="ltr"><Phone className="h-3 w-3" /> {b.phone}</p>}
              {b.address && <p className="flex items-start gap-1 text-xs text-ink-muted"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {b.address}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setDraft(b)} className="btn-outline btn-sm flex-1"><Pencil className="h-4 w-4" /> تعديل</button>
                <button onClick={() => remove(b.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'تعديل فرع' : 'فرع جديد'}>
        {draft && (
          <div className="space-y-4">
            <div><label className="field-label">اسم الفرع</label><input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">المدينة / القضاء</label><input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="field" /></div>
              <div><label className="field-label">الهاتف</label><input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} dir="ltr" className="field text-right" /></div>
            </div>
            <div><label className="field-label">العنوان</label><input value={draft.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className="field" /></div>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={draft.is_main ?? false} onChange={(e) => setDraft({ ...draft, is_main: e.target.checked })} className="h-5 w-5 accent-brand-red" /><span className="font-bold text-ink">الفرع الرئيسي</span></label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-5 w-5 accent-brand-red" /><span className="font-bold text-ink">مفعّل</span></label>
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
          </div>
        )}
      </Modal>
    </>
  );
}
