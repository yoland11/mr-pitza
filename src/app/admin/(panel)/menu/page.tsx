'use client';

import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MultiImageUpload, type DraftImage } from '@/components/admin/MultiImageUpload';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Category, Product } from '@/lib/types';
import { cn, effectivePrice, formatPrice } from '@/lib/utils';

interface SizeDraft { name: string; price_delta: number; is_default: boolean }
interface AddonDraft { name: string; price: number }
interface Draft {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  base_price: number;
  discount_price: number | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  sizes: SizeDraft[];
  addons: AddonDraft[];
  images: DraftImage[];
}

const emptyDraft = (categoryId: string): Draft => ({
  category_id: categoryId,
  name: '',
  slug: '',
  description: '',
  image_url: null,
  base_price: 0,
  discount_price: null,
  is_available: true,
  is_featured: false,
  sort_order: 0,
  sizes: [],
  addons: [],
  images: [],
});

export default function AdminMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, sizes:product_sizes(*), addons:product_addons(*)').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts((prods as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    if (categories.length === 0) return toast.error('أضف قسماً واحداً على الأقل أولاً');
    setDraft(emptyDraft(categories[0].id));
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setDraft({
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      image_url: p.image_url,
      base_price: p.base_price,
      discount_price: p.discount_price,
      is_available: p.is_available,
      is_featured: p.is_featured,
      sort_order: p.sort_order,
      sizes: (p.sizes ?? []).map((s) => ({ name: s.name, price_delta: s.price_delta, is_default: s.is_default })),
      addons: (p.addons ?? []).map((a) => ({ name: a.name, price: a.price })),
      images: [...(p.images ?? [])]
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
        .map((im) => ({ url: im.url, is_primary: im.is_primary })),
    });
    setOpen(true);
  };

  const toggleAvailable = async (p: Product) => {
    const supabase = createClient();
    const { error } = await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id);
    if (error) return toast.error('تعذّر التحديث');
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_available: !x.is_available } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا المنتج نهائياً؟')) return;
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error('تعذّر الحذف');
    toast.success('تم الحذف');
    setProducts((p) => p.filter((x) => x.id !== id));
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.slug.trim()) return toast.error('الاسم والمعرّف مطلوبان');
    if (draft.base_price <= 0) return toast.error('أدخل سعراً صحيحاً');
    setSaving(true);
    const supabase = createClient();
    const primaryUrl =
      draft.images.find((i) => i.is_primary)?.url ?? draft.images[0]?.url ?? draft.image_url ?? null;
    const payload = {
      category_id: draft.category_id,
      name: draft.name,
      slug: draft.slug,
      description: draft.description || null,
      image_url: primaryUrl,
      base_price: draft.base_price,
      discount_price: draft.discount_price || null,
      is_available: draft.is_available,
      is_featured: draft.is_featured,
      sort_order: Number(draft.sort_order) || 0,
    };

    let productId = draft.id;
    if (draft.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', draft.id);
      if (error) {
        setSaving(false);
        return toast.error('تعذّر الحفظ — قد يكون المعرّف مكرراً');
      }
      await supabase.from('product_sizes').delete().eq('product_id', draft.id);
      await supabase.from('product_addons').delete().eq('product_id', draft.id);
      await supabase.from('product_images').delete().eq('product_id', draft.id);
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single();
      if (error || !data) {
        setSaving(false);
        return toast.error('تعذّر الإنشاء — قد يكون المعرّف مكرراً');
      }
      productId = data.id;
    }

    if (draft.sizes.length > 0) {
      await supabase.from('product_sizes').insert(
        draft.sizes.map((s, i) => ({ product_id: productId, name: s.name, price_delta: s.price_delta, is_default: s.is_default, sort_order: i })),
      );
    }
    if (draft.addons.length > 0) {
      await supabase.from('product_addons').insert(
        draft.addons.map((a) => ({ product_id: productId, name: a.name, price: a.price, is_active: true })),
      );
    }
    if (draft.images.length > 0) {
      await supabase.from('product_images').insert(
        draft.images.map((im, i) => ({
          product_id: productId,
          url: im.url,
          is_primary: im.is_primary,
          sort_order: i,
        })),
      );
    }

    setSaving(false);
    toast.success('تم حفظ المنتج');
    setOpen(false);
    load();
  };

  const filtered = catFilter === 'all' ? products : products.filter((p) => p.category_id === catFilter);

  return (
    <>
      <AdminPageHeader
        title="إدارة المنيو"
        subtitle="أضف وعدّل منتجاتك مع الأحجام والإضافات"
        action={<button onClick={openNew} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> منتج جديد</button>}
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active={catFilter === 'all'} onClick={() => setCatFilter('all')}>الكل</Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.name}</Chip>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="card flex gap-3 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line">
                {p.image_url ? <Image src={p.image_url} alt={p.name} fill sizes="80px" className="object-cover" /> : <div className="grid h-full place-items-center text-2xl">🍕</div>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-extrabold text-ink">{p.name}</p>
                <p className="text-sm font-bold text-brand-red">{formatPrice(effectivePrice(p))}</p>
                <div className="mt-auto flex gap-1 pt-2">
                  <button onClick={() => toggleAvailable(p)} className={cn('grid h-8 w-8 place-items-center rounded-lg', p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')} title={p.is_available ? 'متوفر' : 'غير متوفر'}>
                    {p.is_available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 hover:bg-brand-red hover:text-white"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft?.id ? 'تعديل منتج' : 'منتج جديد'}>
        {draft && (
          <div className="space-y-4">
            <MultiImageUpload value={draft.images} onChange={(images) => setDraft({ ...draft, images })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">اسم المنتج</label>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" />
              </div>
              <div>
                <label className="field-label">المعرّف (slug)</label>
                <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} dir="ltr" className="field text-right" />
              </div>
            </div>
            <div>
              <label className="field-label">القسم</label>
              <select value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })} className="field">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">الوصف</label>
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="field resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">السعر الأساسي</label>
                <input type="number" value={draft.base_price} onChange={(e) => setDraft({ ...draft, base_price: Number(e.target.value) })} className="field" />
              </div>
              <div>
                <label className="field-label">سعر بعد الخصم (اختياري)</label>
                <input type="number" value={draft.discount_price ?? ''} onChange={(e) => setDraft({ ...draft, discount_price: e.target.value ? Number(e.target.value) : null })} className="field" />
              </div>
            </div>

            {/* الأحجام */}
            <DynamicList
              title="الأحجام"
              addLabel="إضافة حجم"
              onAdd={() => setDraft({ ...draft, sizes: [...draft.sizes, { name: '', price_delta: 0, is_default: draft.sizes.length === 0 }] })}
              items={draft.sizes}
              onRemove={(i) => setDraft({ ...draft, sizes: draft.sizes.filter((_, x) => x !== i) })}
              render={(s, i) => (
                <>
                  <input value={s.name} onChange={(e) => updateAt(draft, setDraft, 'sizes', i, { name: e.target.value })} className="field py-2" placeholder="الاسم (صغير)" />
                  <input type="number" value={s.price_delta} onChange={(e) => updateAt(draft, setDraft, 'sizes', i, { price_delta: Number(e.target.value) })} className="field w-28 py-2" placeholder="+السعر" />
                  <label className="flex shrink-0 items-center gap-1 text-xs font-bold">
                    <input type="radio" name="defaultSize" checked={s.is_default} onChange={() => setDraft({ ...draft, sizes: draft.sizes.map((x, xi) => ({ ...x, is_default: xi === i })) })} className="accent-brand-red" />
                    افتراضي
                  </label>
                </>
              )}
            />

            {/* الإضافات */}
            <DynamicList
              title="الإضافات"
              addLabel="إضافة"
              onAdd={() => setDraft({ ...draft, addons: [...draft.addons, { name: '', price: 0 }] })}
              items={draft.addons}
              onRemove={(i) => setDraft({ ...draft, addons: draft.addons.filter((_, x) => x !== i) })}
              render={(a, i) => (
                <>
                  <input value={a.name} onChange={(e) => updateAt(draft, setDraft, 'addons', i, { name: e.target.value })} className="field py-2" placeholder="الاسم (جبن إضافي)" />
                  <input type="number" value={a.price} onChange={(e) => updateAt(draft, setDraft, 'addons', i, { price: Number(e.target.value) })} className="field w-28 py-2" placeholder="السعر" />
                </>
              )}
            />

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={draft.is_available} onChange={(e) => setDraft({ ...draft, is_available: e.target.checked })} className="h-5 w-5 accent-brand-red" />
                <span className="font-bold text-ink">متوفر</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })} className="h-5 w-5 accent-brand-red" />
                <span className="font-bold text-ink">مميّز (أشهر الوجبات)</span>
              </label>
            </div>

            <button onClick={save} disabled={saving} className="btn-primary w-full">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ المنتج'}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

function updateAt(
  draft: Draft,
  setDraft: (d: Draft) => void,
  key: 'sizes' | 'addons',
  index: number,
  patch: object,
) {
  setDraft({ ...draft, [key]: (draft[key] as object[]).map((it, i) => (i === index ? { ...it, ...patch } : it)) } as Draft);
}

function DynamicList<T>({
  title,
  addLabel,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  addLabel: string;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-extrabold text-ink">{title}</span>
        <button type="button" onClick={onAdd} className="btn-outline btn-sm"><Plus className="h-4 w-4" /> {addLabel}</button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            {render(it, i)}
            <button type="button" onClick={() => onRemove(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink hover:bg-brand-red hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-ink-muted">لا توجد عناصر</p>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition', active ? 'bg-brand-red text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-ink/5')}>
      {children}
    </button>
  );
}
