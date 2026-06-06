'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';

/** رفع صورة إلى حاوية menu في Supabase Storage وإرجاع الرابط العام */
export function ImageUpload({
  value,
  onChange,
  folder = 'products',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميغابايت');
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('menu').upload(path, file, { upsert: false });
      if (error) {
        toast.error('تعذّر رفع الصورة');
        return;
      }
      const { data } = supabase.storage.from('menu').getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success('تم رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-line">
          <Image src={value} alt="معاينة" fill sizes="400px" className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-brand-red"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-cream text-ink-muted transition hover:border-brand-red hover:text-brand-red">
          {uploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <ImagePlus className="h-7 w-7" />}
          <span className="text-sm font-bold">{uploading ? 'جارٍ الرفع...' : 'اختر صورة للرفع'}</span>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      )}
    </div>
  );
}
