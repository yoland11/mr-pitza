'use client';

import { Plus, Settings2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/store/cart';
import { toast } from '@/lib/store/toast';
import type { Product } from '@/lib/types';
import { cn, discountPercent, effectivePrice, formatPrice } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const price = effectivePrice(product);
  const off = discountPercent(product);
  const hasOptions = (product.sizes?.length ?? 0) > 0 || (product.addons?.length ?? 0) > 0;
  const soldOut = !product.is_available;

  const quickAdd = () => {
    const defaultSize = product.sizes?.find((s) => s.is_default) ?? product.sizes?.[0] ?? null;
    addItem({
      productId: product.id,
      name: product.name,
      image_url: product.image_url,
      basePrice: price,
      size: defaultSize ? { id: defaultSize.id, name: defaultSize.name, priceDelta: defaultSize.price_delta } : null,
      addons: [],
      quantity: 1,
      notes: '',
    });
    toast.success(`تمت إضافة ${product.name} للسلة`);
  };

  return (
    <article className={cn('card group flex flex-col transition-all hover:-translate-y-1 hover:shadow-card-hover', soldOut && 'opacity-75')}>
      <Link href={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-line">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full place-items-center text-5xl">🍕</div>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {off > 0 && <span className="badge-red shadow-card">خصم {off}%</span>}
        </div>
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-ink/55">
            <span className="badge bg-white text-ink">غير متوفر حالياً</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-1 text-base font-extrabold text-ink hover:text-brand-red">{product.name}</h3>
        </Link>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{product.description}</p>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div className="leading-tight">
            <span className="text-lg font-extrabold text-brand-red">{formatPrice(price)}</span>
            {off > 0 && (
              <span className="mr-1 block text-xs font-bold text-ink-muted line-through">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {hasOptions ? (
            <Link href={`/product/${product.id}`} className="btn-outline btn-sm flex-1">
              <Settings2 className="h-4 w-4" />
              خيارات
            </Link>
          ) : null}
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut}
            className={cn('btn-primary btn-sm', hasOptions ? 'aspect-square px-0' : 'flex-1')}
            aria-label="أضف للسلة"
          >
            <Plus className="h-4 w-4" />
            {!hasOptions && 'أضف للسلة'}
          </button>
        </div>
      </div>
    </article>
  );
}
