'use client';

import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Category } from '@/lib/types';

type Draft = Partial<Category>;

const empty: Draft = { name: '', slug: '', description: '', image_url: null, sort_order: 0, is_active: true };

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setItems((data as Category[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setDraft(empty);
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setDraft(c);
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name?.trim() || !draft.slug?.trim()) {
      toast.error('الاسم والمعرّف (slug) مطلوبان');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: draft.name,
      slug: draft.slug,
      description: draft.description || null,
      image_url: draft.image_url || null,
      sort_order: Number(draft.sort_order) || 0,
      is_active: draft.is_active ?? true,
    };
    const { error } = draft.id
      ? await supabase.from('categories').update(payload).eq('id', draft.id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ — تأكد أن المعرّف غير مكرر');
    toast.success('تم الحفظ');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف القسم سيحذف منتجاته. متابعة؟')) return;
    const supabase = createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return toast.error('تعذّر الحذف');
    toast.success('تم الحذف');
    setItems((p) => p.filter((c) => c.id !== id));
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة الأقسام"
        subtitle="أضف وعدّل أقسام المنيو"
        action={<button onClick={openNew} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> قسم جديد</button>}
      />

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-line">
                {c.image_url ? <Image src={c.image_url} alt={c.name} fill sizes="64px" className="object-cover" /> : <div className="grid h-full place-items-center text-2xl">🍴</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-ink">{c.name}</p>
                <p className="truncate text-xs text-ink-muted">{c.slug}</p>
                {!c.is_active && <span className="badge-soft mt-1">معطّل</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'تعديل قسم' : 'قسم جديد'}>
        <div className="space-y-4">
          <div>
            <label className="field-label">اسم القسم</label>
            <input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" placeholder="مثال: بيتزا" />
          </div>
          <div>
            <label className="field-label">المعرّف (slug) — إنجليزي بدون مسافات</label>
            <input value={draft.slug ?? ''} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} dir="ltr" className="field text-right" placeholder="pizza" />
          </div>
          <div>
            <label className="field-label">الوصف</label>
            <input value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="field" />
          </div>
          <div>
            <label className="field-label">صورة القسم</label>
            <ImageUpload value={draft.image_url ?? null} onChange={(url) => setDraft({ ...draft, image_url: url })} folder="categories" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="field-label">الترتيب</label>
              <input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="field" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pt-6">
              <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-5 w-5 accent-brand-red" />
              <span className="font-bold text-ink">مفعّل</span>
            </label>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}
          </button>
        </div>
      </Modal>
    </>
  );
}
