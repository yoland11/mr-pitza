import { Sparkles } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

/** اقتراحات ذكية للبيع المتقاطع — تُعرض في صفحة المنتج والسلة */
export function CrossSell({ products, title = 'أضف إلى طلبك' }: { products: Product[]; title?: string }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-ink">
        <Sparkles className="h-5 w-5 text-brand-yellow" /> {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
