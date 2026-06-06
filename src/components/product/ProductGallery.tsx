'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  fallbackUrl,
  name,
  off,
  available,
}: {
  images: ProductImage[];
  fallbackUrl: string | null;
  name: string;
  off: number;
  available: boolean;
}) {
  // ترتيب الصور: الرئيسية أولاً ثم حسب الترتيب
  const sorted = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const urls = sorted.length > 0 ? sorted.map((i) => i.url) : fallbackUrl ? [fallbackUrl] : [];
  const [active, setActive] = useState(0);
  const current = urls[active] ?? null;

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-square overflow-hidden rounded-4xl bg-line shadow-card">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 580px"
            className="object-contain"
          />
        ) : (
          <div className="grid h-full place-items-center text-8xl">🍕</div>
        )}
        {off > 0 && <span className="badge-red absolute right-4 top-4 text-sm shadow-card">خصم {off}%</span>}
        {!available && (
          <div className="absolute inset-0 grid place-items-center bg-ink/55">
            <span className="badge bg-white text-base text-ink">غير متوفر حالياً</span>
          </div>
        )}
      </div>

      {/* الصور المصغّرة */}
      {urls.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl bg-line ring-2 transition',
                active === i ? 'ring-brand-red' : 'ring-transparent hover:ring-brand-red/40',
              )}
              aria-label={`صورة ${i + 1}`}
            >
              <Image src={url} alt={`${name} ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
