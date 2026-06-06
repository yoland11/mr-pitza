'use client';

import { Check, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useCart } from '@/lib/store/cart';
import { toast } from '@/lib/store/toast';
import type { CartAddon, Product } from '@/lib/types';
import { cn, effectivePrice, formatPrice } from '@/lib/utils';

export function ProductConfigurator({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const basePrice = effectivePrice(product);
  const sizes = product.sizes ?? [];
  const addons = (product.addons ?? []).filter((a) => a.is_active);

  const defaultSize = sizes.find((s) => s.is_default) ?? sizes[0] ?? null;
  const [sizeId, setSizeId] = useState<string | null>(defaultSize?.id ?? null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const size = sizes.find((s) => s.id === sizeId) ?? null;

  const unitPrice = useMemo(() => {
    const sizeDelta = size?.price_delta ?? 0;
    const addonsSum = addons
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((s, a) => s + a.price, 0);
    return basePrice + sizeDelta + addonsSum;
  }, [basePrice, size, addons, selectedAddons]);

  const total = unitPrice * quantity;

  const toggleAddon = (id: string) =>
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleAdd = (goToCart = false) => {
    if (!product.is_available) return;
    const cartAddons: CartAddon[] = addons
      .filter((a) => selectedAddons.includes(a.id))
      .map((a) => ({ id: a.id, name: a.name, price: a.price }));

    addItem({
      productId: product.id,
      name: product.name,
      image_url: product.image_url,
      basePrice,
      size: size ? { id: size.id, name: size.name, priceDelta: size.price_delta } : null,
      addons: cartAddons,
      quantity,
      notes: notes.trim(),
    });
    toast.success(`تمت إضافة ${product.name} للسلة`);
    if (goToCart) router.push('/cart');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* الأحجام */}
      {sizes.length > 0 && (
        <div>
          <h3 className="field-label">اختر الحجم</h3>
          <div className="grid grid-cols-3 gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSizeId(s.id)}
                className={cn(
                  'rounded-2xl border-2 p-3 text-center transition',
                  sizeId === s.id
                    ? 'border-brand-red bg-brand-red/5 shadow-glow'
                    : 'border-line bg-white hover:border-brand-red/40',
                )}
              >
                <span className="block text-sm font-extrabold text-ink">{s.name}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {s.price_delta > 0 ? `+ ${formatPrice(s.price_delta)}` : 'السعر الأساسي'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* الإضافات */}
      {addons.length > 0 && (
        <div>
          <h3 className="field-label">الإضافات (اختياري)</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {addons.map((a) => {
              const on = selectedAddons.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAddon(a.id)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2.5 text-right transition',
                    on ? 'border-brand-red bg-brand-red/5' : 'border-line bg-white hover:border-brand-red/40',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'grid h-5 w-5 place-items-center rounded-md border-2 transition',
                        on ? 'border-brand-red bg-brand-red text-white' : 'border-line',
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-sm font-bold text-ink">{a.name}</span>
                  </span>
                  <span className="text-xs font-bold text-brand-red">+{formatPrice(a.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ملاحظات خاصة */}
      <div>
        <label htmlFor="notes" className="field-label">ملاحظات خاصة (اختياري)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="مثال: بدون بصل، حار إضافي..."
          className="field resize-none"
        />
      </div>

      {/* الكمية والسعر */}
      <div className="flex items-center justify-between">
        <div>
          <span className="field-label">الكمية</span>
          <QuantityStepper value={quantity} onChange={setQuantity} />
        </div>
        <div className="text-left">
          <span className="block text-xs text-ink-muted">السعر النهائي</span>
          <span className="text-2xl font-black text-brand-red">{formatPrice(total)}</span>
        </div>
      </div>

      {/* الأزرار */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => handleAdd(false)}
          disabled={!product.is_available}
          className="btn-outline flex-1"
        >
          <ShoppingCart className="h-5 w-5" />
          أضف للسلة
        </button>
        <button
          type="button"
          onClick={() => handleAdd(true)}
          disabled={!product.is_available}
          className="btn-primary flex-1"
        >
          أضف واذهب للسلة
        </button>
      </div>
      {!product.is_available && (
        <p className="text-center text-sm font-bold text-brand-red">هذا المنتج غير متوفر حالياً</p>
      )}
    </div>
  );
}
