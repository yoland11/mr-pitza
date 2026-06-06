'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartAddon, CartItem } from '@/lib/types';

interface AddItemInput {
  productId: string;
  name: string;
  image_url: string | null;
  basePrice: number;
  size: { id: string; name: string; priceDelta: number } | null;
  addons: CartAddon[];
  quantity: number;
  notes: string;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number; // مبلغ خصم الكوبون (يُحسب في الـ checkout)
  addItem: (input: AddItemInput) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  setCoupon: (code: string | null, discount: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
  productDiscount: () => number;
}

function buildKey(input: AddItemInput): string {
  const addonIds = input.addons
    .map((a) => a.id)
    .sort()
    .join('-');
  const note = input.notes ? `n${input.notes.length}` : '';
  return `${input.productId}__${input.size?.id ?? 'na'}__${addonIds || 'noadd'}__${note}`;
}

function computeUnitPrice(input: Pick<AddItemInput, 'basePrice' | 'size' | 'addons'>): number {
  const sizeDelta = input.size?.priceDelta ?? 0;
  const addonsSum = input.addons.reduce((s, a) => s + a.price, 0);
  return input.basePrice + sizeDelta + addonsSum;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,

      addItem: (input) => {
        const key = buildKey(input);
        const unitPrice = computeUnitPrice(input);
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key
                  ? {
                      ...i,
                      quantity: i.quantity + input.quantity,
                      lineTotal: (i.quantity + input.quantity) * i.unitPrice,
                    }
                  : i,
              ),
            };
          }
          const newItem: CartItem = {
            key,
            productId: input.productId,
            name: input.name,
            image_url: input.image_url,
            basePrice: input.basePrice,
            size: input.size,
            addons: input.addons,
            quantity: input.quantity,
            notes: input.notes,
            unitPrice,
            lineTotal: unitPrice * input.quantity,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.key === key
                ? { ...i, quantity: Math.max(1, quantity), lineTotal: Math.max(1, quantity) * i.unitPrice }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),

      clear: () => set({ items: [], couponCode: null, couponDiscount: 0 }),

      count: () => get().items.reduce((s, i) => s + i.quantity, 0),

      subtotal: () => get().items.reduce((s, i) => s + i.lineTotal, 0),

      productDiscount: () => 0, // الخصم على مستوى المنتج مطبّق مسبقاً في basePrice
    }),
    {
      name: 'mr-pizza-cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    },
  ),
);
