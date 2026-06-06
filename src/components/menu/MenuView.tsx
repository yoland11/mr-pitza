'use client';

import { Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductCard } from './ProductCard';
import type { Category, Product } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MenuView({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const params = useSearchParams();
  const initialCat = params.get('cat');
  const [active, setActive] = useState<string>('all');
  const [query, setQuery] = useState('');
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCat) {
      const found = categories.find((c) => c.slug === initialCat);
      if (found) setActive(found.id);
    }
  }, [initialCat, categories]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const byCat = active === 'all' || p.category_id === active;
      const byQuery =
        !query.trim() ||
        p.name.includes(query.trim()) ||
        (p.description?.includes(query.trim()) ?? false);
      return byCat && byQuery;
    });
  }, [products, active, query]);

  const tabs = [{ id: 'all', name: 'الكل' }, ...categories.map((c) => ({ id: c.id, name: c.name }))];

  return (
    <div>
      {/* البحث */}
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن وجبة..."
          className="field pr-12 pl-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="مسح"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand-red"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* تبويبات الأقسام */}
      <div
        ref={railRef}
        className="no-scrollbar sticky top-16 z-30 -mx-4 mb-7 flex gap-2 overflow-x-auto bg-cream/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:px-3"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition',
              active === t.id ? 'bg-brand-red text-white shadow-card' : 'bg-white text-ink hover:bg-ink/5',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* الشبكة */}
      {filtered.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-16 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-lg font-bold text-ink">لا توجد نتائج</p>
          <p className="text-sm text-ink-muted">جرّب قسماً آخر أو كلمة بحث مختلفة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
