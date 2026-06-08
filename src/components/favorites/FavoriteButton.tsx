'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFavorites } from '@/lib/store/favorites';
import { cn } from '@/lib/utils';

export function FavoriteButton({ productId, className }: { productId: string; className?: string }) {
  const { isFav, toggle, loaded, load } = useFavorites();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!loaded) load();
  }, [loaded, load]);

  const active = mounted && isFav(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-label="المفضلة"
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-card transition hover:scale-105',
        active && 'text-brand-red',
        className,
      )}
    >
      <Heart className={cn('h-5 w-5', active && 'fill-brand-red')} />
    </button>
  );
}
