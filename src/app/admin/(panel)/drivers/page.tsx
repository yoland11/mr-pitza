'use client';

import { Bike, Loader2, Pencil, Phone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { DRIVER_STATUS_LABELS, type Driver } from '@/lib/types';
import { cn } from '@/lib/utils';

type Draft = Partial<Driver>;
const genCode = () => String(Math.floor(1000 + Math.random() * 9000));
const empty = (): Draft => ({ name: '', phone: '', vehicle: '', code: genCode(), status: 'available', is_active: true });

export default function AdminDrivers() {
  const [items, setItems] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('drivers').select('*').order('created_at', { ascending: false });
    setItems((data as Driver[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft.name?.trim() || !draft.phone?.trim()) return toast.error('الاسم والهاتف مطلوبان');
    if (!draft.code?.trim()) return toast.error('رمز الدخول مطلوب');
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: draft.name,
      phone: draft.phone,
      vehicle: draft.vehicle || null,
      code: draft.code,
      status: draft.status ?? 'available',
      is_active: draft.is_active ?? true,
    };
    const { error } = draft.id
      ? await supabase.from('drivers').update(payload).eq('id', draft.id)
      : await supabase.from('drivers').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ');
    toast.success('تم الحفظ');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا السائق؟')) return;
    const supabase = createClient();
    await supabase.from('drivers').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة السائقين"
        subtitle="أضف سائقي التوصيل وامنحهم رمز دخول لتطبيق السائق /driver"
        action={<button onClick={() => { setDraft(empty()); setOpen(true); }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> سائق جديد</button>}
      />

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : items.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <Bike className="h-9 w-9 text-brand-red" />
          <p className="mt-2 font-bold text-ink">لا يوجد سائقون بعد</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red/10 text-brand-red"><Bike className="h-5 w-5" /></span>
                  <div>
                    <p className="font-extrabold text-ink">{d.name}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-muted" dir="ltr"><Phone className="h-3 w-3" /> {d.phone}</p>
                  </div>
                </div>
                <span className={cn('badge', d.is_active ? 'badge-yellow' : 'badge-soft')}>{DRIVER_STATUS_LABELS[d.status]}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
                <span className="text-ink-muted">رمز الدخول</span>
                <span className="font-mono text-lg font-black text-ink">{d.code}</span>
              </div>
              {d.vehicle && <p className="mt-2 text-xs text-ink-muted">المركبة: {d.vehicle}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setDraft(d); setOpen(true); }} className="btn-outline btn-sm flex-1"><Pencil className="h-4 w-4" /> تعديل</button>
                <button onClick={() => remove(d.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'تعديل سائق' : 'سائق جديد'}>
        <div className="space-y-4">
          <div><label className="field-label">الاسم</label><input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" /></div>
          <div><label className="field-label">رقم الهاتف</label><input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} dir="ltr" className="field text-right" placeholder="07XXXXXXXXX" /></div>
          <div><label className="field-label">المركبة (اختياري)</label><input value={draft.vehicle ?? ''} onChange={(e) => setDraft({ ...draft, vehicle: e.target.value })} className="field" placeholder="دراجة نارية / سيارة" /></div>
          <div>
            <label className="field-label">رمز الدخول لتطبيق السائق</label>
            <div className="flex gap-2">
              <input value={draft.code ?? ''} onChange={(e) => setDraft({ ...draft, code: e.target.value })} dir="ltr" className="field text-right font-mono" />
              <button type="button" onClick={() => setDraft({ ...draft, code: genCode() })} className="btn-outline btn-sm shrink-0"><RefreshCw className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="field-label">الحالة</label>
              <select value={draft.status ?? 'available'} onChange={(e) => setDraft({ ...draft, status: e.target.value as Driver['status'] })} className="field">
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
                <option value="offline">غير متصل</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 pt-6">
              <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-5 w-5 accent-brand-red" />
              <span className="font-bold text-ink">مفعّل</span>
            </label>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
        </div>
      </Modal>
    </>
  );
}
