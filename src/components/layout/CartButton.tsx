'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/store/cart';

export function CartButton({ light = false }: { light?: boolean }) {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/cart"
      aria-label="السلة"
      className="relative grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-brand-red hover:text-white"
    >
      <ShoppingCart className="h-5 w-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-yellow px-1 text-[11px] font-extrabold text-ink ring-2 ring-white">
          {count}
        </span>
      )}
    </Link>
  );
}
