'use client';

import { Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/menu/ProductCard';
import { createClient } from '@/lib/supabase/client';
import { useFavorites } from '@/lib/store/favorites';
import type { Product } from '@/lib/types';

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const ids = useFavorites((s) => s.ids);
  const load = useFavorites((s) => s.load);

  useEffect(() => {
    (async () => {
      await load();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('favorites')
        .select('product:products(*, sizes:product_sizes(*), addons:product_addons(*))')
        .eq('user_id', user.id);
      const rows = (data ?? []) as Array<{ product: Product | Product[] | null }>;
      const list = rows
        .map((r) => (Array.isArray(r.product) ? r.product[0] : r.product))
        .filter((p): p is Product => !!p);
      setProducts(list);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // المزامنة: عند إزالة منتج من المفضلة أخفِه فوراً
  const visible = products.filter((p) => ids.includes(p.id));

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>;

  if (visible.length === 0) {
    return (
      <div className="card grid place-items-center py-16 text-center text-ink-muted">
        <Heart className="h-9 w-9 text-brand-red" />
        <p className="mt-2 font-bold text-ink">لا توجد منتجات في المفضلة</p>
        <Link href="/menu" className="btn-primary mt-3">تصفّح المنيو</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {visible.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
