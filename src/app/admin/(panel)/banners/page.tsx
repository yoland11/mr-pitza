'use client';

import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Banner } from '@/lib/types';
import { cn } from '@/lib/utils';

type Draft = Partial<Banner>;
const empty: Draft = { title: '', subtitle: '', image_url: '', link_url: '', sort_order: 0, is_active: true };

export default function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setItems((data as Banner[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft.image_url) return toast.error('صورة البانر مطلوبة');
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: draft.title || null,
      subtitle: draft.subtitle || null,
      image_url: draft.image_url,
      link_url: draft.link_url || null,
      sort_order: Number(draft.sort_order) || 0,
      is_active: draft.is_active ?? true,
    };
    const { error } = draft.id
      ? await supabase.from('banners').update(payload).eq('id', draft.id)
      : await supabase.from('banners').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ');
    toast.success('تم الحفظ');
    setOpen(false);
    load();
  };

  const toggle = async (b: Banner) => {
    const supabase = createClient();
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
    setItems((p) => p.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا البانر؟')) return;
    const supabase = createClient();
    await supabase.from('banners').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة السلايدر والبانرات"
        subtitle="أضف صور العروض الترويجية"
        action={<button onClick={() => { setDraft(empty); setOpen(true); }} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> بانر جديد</button>}
      />

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              <div className="relative aspect-[16/7] bg-line">
                {b.image_url && <Image src={b.image_url} alt={b.title ?? 'بانر'} fill sizes="500px" className="object-cover" />}
                <button onClick={() => toggle(b)} className={cn('badge absolute right-2 top-2', b.is_active ? 'badge-yellow' : 'badge-soft')}>{b.is_active ? 'مفعّل' : 'معطّل'}</button>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-ink">{b.title || 'بدون عنوان'}</p>
                  <p className="truncate text-xs text-ink-muted">{b.subtitle}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setDraft(b); setOpen(true); }} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(b.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'تعديل بانر' : 'بانر جديد'}>
        <div className="space-y-4">
          <ImageUpload value={draft.image_url ?? null} onChange={(url) => setDraft({ ...draft, image_url: url ?? '' })} folder="banners" />
          <div>
            <label className="field-label">العنوان</label>
            <input value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="field" />
          </div>
          <div>
            <label className="field-label">العنوان الفرعي</label>
            <input value={draft.subtitle ?? ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className="field" />
          </div>
          <div>
            <label className="field-label">رابط عند الضغط (اختياري)</label>
            <input value={draft.link_url ?? ''} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} dir="ltr" className="field text-right" placeholder="/offers" />
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
          <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
        </div>
      </Modal>
    </>
  );
}
