'use client';

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { cn } from '@/lib/utils';

export interface DraftImage {
  url: string;
  is_primary: boolean;
}

/** إدارة عدة صور للمنتج: رفع، تحديد رئيسية، حذف، ترتيب */
export function MultiImageUpload({
  value,
  onChange,
}: {
  value: DraftImage[];
  onChange: (imgs: DraftImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const normalize = (imgs: DraftImage[]): DraftImage[] => {
    if (imgs.length === 0 || imgs.some((i) => i.is_primary)) return imgs;
    return imgs.map((im, i) => (i === 0 ? { ...im, is_primary: true } : im));
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const added: DraftImage[] = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: الحجم أكبر من 5MB`);
          continue;
        }
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('menu').upload(path, file);
        if (error) {
          toast.error('تعذّر رفع صورة');
          continue;
        }
        const { data } = supabase.storage.from('menu').getPublicUrl(path);
        added.push({ url: data.publicUrl, is_primary: false });
      }
      const next = normalize([...value, ...added]);
      onChange(next);
      if (added.length) toast.success(`تم رفع ${added.length} صورة`);
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = (i: number) => onChange(value.map((img, x) => ({ ...img, is_primary: x === i })));
  const remove = (i: number) => onChange(normalize(value.filter((_, x) => x !== i)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <label className="field-label">صور المنتج (يمكن رفع عدة صور — اختر صورة رئيسية)</label>
      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((img, i) => (
            <div key={i} className={cn('relative aspect-square overflow-hidden rounded-xl bg-line ring-2', img.is_primary ? 'ring-brand-red' : 'ring-transparent')}>
              <Image src={img.url} alt={`صورة ${i + 1}`} fill sizes="120px" className="object-cover" />
              {img.is_primary && <span className="badge-red absolute right-1 top-1 px-1.5 py-0.5 text-[10px]">رئيسية</span>}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-1 py-1">
                <button type="button" onClick={() => setPrimary(i)} title="تعيين كرئيسية" className="text-white hover:text-brand-yellow">
                  <Star className={cn('h-4 w-4', img.is_primary && 'fill-brand-yellow text-brand-yellow')} />
                </button>
                <div className="flex items-center gap-0.5">
                  <button type="button" onClick={() => move(i, 1)} title="تأخير" className="text-white hover:text-brand-yellow"><ChevronRight className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(i, -1)} title="تقديم" className="text-white hover:text-brand-yellow"><ChevronLeft className="h-4 w-4" /></button>
                </div>
                <button type="button" onClick={() => remove(i)} title="حذف" className="text-white hover:text-brand-red"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-cream px-4 py-4 text-sm font-bold text-ink-muted transition hover:border-brand-red hover:text-brand-red">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        {uploading ? 'جارٍ الرفع...' : 'إضافة صور'}
        <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} className="hidden" />
      </label>
    </div>
  );
}
