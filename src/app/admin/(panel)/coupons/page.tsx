'use client';

import { Loader2, Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Coupon } from '@/lib/types';
import { cn, formatDate, formatPrice } from '@/lib/utils';

type Draft = Partial<Coupon>;
const empty: Draft = {
  code: '', description: '', type: 'percent', discount_percent: 10, amount: 0,
  max_discount: null, min_order: 0, usage_limit: null, per_user_limit: null,
  starts_at: null, expires_at: null, first_order_only: false, customers_only: false, is_active: true,
};

export default function AdminCoupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setItems((data as Coupon[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft.code?.trim()) return toast.error('كود الكوبون مطلوب');
    const type = draft.type ?? 'percent';
    const percent = Number(draft.discount_percent) || 0;
    const amount = Number(draft.amount) || 0;
    if (type === 'percent' && (percent < 1 || percent > 100)) return toast.error('نسبة الخصم يجب أن تكون بين 1 و 100');
    if (type === 'fixed' && amount <= 0) return toast.error('أدخل مبلغ خصم صحيحاً');
    setSaving(true);
    const supabase = createClient();
    const payload = {
      code: draft.code.toUpperCase().trim(),
      description: draft.description || null,
      type,
      discount_percent: type === 'percent' ? percent : 0,
      amount: type === 'fixed' ? amount : 0,
      max_discount: draft.max_discount ? Number(draft.max_discount) : null,
      min_order: Number(draft.min_order) || 0,
      usage_limit: draft.usage_limit ? Number(draft.usage_limit) : null,
      per_user_limit: draft.per_user_limit ? Number(draft.per_user_limit) : null,
      starts_at: draft.starts_at || null,
      expires_at: draft.expires_at || null,
      first_order_only: draft.first_order_only ?? false,
      customers_only: draft.customers_only ?? false,
      is_active: draft.is_active ?? true,
    };
    const { error } = draft.id
      ? await supabase.from('coupons').update(payload).eq('id', draft.id)
      : await supabase.from('coupons').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ — قد يكون الكود مكرراً');
    toast.success('تم الحفظ');
    setOpen(false);
    load();
  };

  const toggle = async (c: Coupon) => {
    const supabase = createClient();
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    setItems((p) => p.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا الكوبون؟')) return;
    const supabase = createClient();
    await supabase.from('coupons').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة الكوبونات"
        subtitle="أنشئ كوبونات خصم وتحكّم بصلاحيتها"
        action={<button onClick={() => { setDraft(empty); setOpen(true); }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> كوبون جديد</button>}
      />

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-red text-white"><Ticket className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-ink">{c.code}</span>
                  <span className="badge-yellow">{c.type === 'fixed' ? formatPrice(c.amount) : `${c.discount_percent}%`}</span>
                  {c.first_order_only && <span className="badge-soft">أول طلب</span>}
                  {c.customers_only && <span className="badge-soft">للأعضاء</span>}
                </div>
                <p className="truncate text-xs text-ink-muted">حد أدنى {formatPrice(c.min_order)}{c.expires_at ? ` · ينتهي ${formatDate(c.expires_at)}` : ''}</p>
              </div>
              <button onClick={() => toggle(c)} className={cn('badge', c.is_active ? 'badge-yellow' : 'badge-soft')}>{c.is_active ? 'مفعّل' : 'معطّل'}</button>
              <button onClick={() => { setDraft(c); setOpen(true); }} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(c.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'تعديل كوبون' : 'كوبون جديد'}>
        <div className="space-y-4">
          <div>
            <label className="field-label">كود الكوبون</label>
            <input value={draft.code ?? ''} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} dir="ltr" className="field text-right font-mono" placeholder="WELCOME" />
          </div>
          <div>
            <label className="field-label">الوصف</label>
            <input value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">نوع الخصم</label>
              <select value={draft.type ?? 'percent'} onChange={(e) => setDraft({ ...draft, type: e.target.value as 'percent' | 'fixed' })} className="field">
                <option value="percent">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت (د.ع)</option>
              </select>
            </div>
            {draft.type === 'fixed' ? (
              <div>
                <label className="field-label">مبلغ الخصم</label>
                <input type="number" value={draft.amount ?? 0} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} className="field" />
              </div>
            ) : (
              <div>
                <label className="field-label">نسبة الخصم %</label>
                <input type="number" value={draft.discount_percent ?? 10} onChange={(e) => setDraft({ ...draft, discount_percent: Number(e.target.value) })} className="field" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">حد أقصى للخصم (اختياري)</label>
              <input type="number" value={draft.max_discount ?? ''} onChange={(e) => setDraft({ ...draft, max_discount: e.target.value ? Number(e.target.value) : null })} className="field" />
            </div>
            <div>
              <label className="field-label">الحد الأدنى للطلب</label>
              <input type="number" value={draft.min_order ?? 0} onChange={(e) => setDraft({ ...draft, min_order: Number(e.target.value) })} className="field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">تاريخ البداية</label>
              <input type="date" value={draft.starts_at ? draft.starts_at.slice(0, 10) : ''} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="field" />
            </div>
            <div>
              <label className="field-label">تاريخ الانتهاء</label>
              <input type="date" value={draft.expires_at ? draft.expires_at.slice(0, 10) : ''} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">حد الاستخدام الكلي</label>
              <input type="number" value={draft.usage_limit ?? ''} onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value ? Number(e.target.value) : null })} className="field" placeholder="بلا حد" />
            </div>
            <div>
              <label className="field-label">حد لكل مستخدم</label>
              <input type="number" value={draft.per_user_limit ?? ''} onChange={(e) => setDraft({ ...draft, per_user_limit: e.target.value ? Number(e.target.value) : null })} className="field" placeholder="بلا حد" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={draft.first_order_only ?? false} onChange={(e) => setDraft({ ...draft, first_order_only: e.target.checked })} className="h-5 w-5 accent-brand-red" />
              <span className="font-bold text-ink">أول طلب فقط</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={draft.customers_only ?? false} onChange={(e) => setDraft({ ...draft, customers_only: e.target.checked })} className="h-5 w-5 accent-brand-red" />
              <span className="font-bold text-ink">للأعضاء فقط</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
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
