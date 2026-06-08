'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { toast } from './toast';

interface FavState {
  ids: string[];
  userId: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isFav: (productId: string) => boolean;
}

export const useFavorites = create<FavState>((set, get) => ({
  ids: [],
  userId: null,
  loaded: false,

  load: async () => {
    if (!isSupabaseConfigured) {
      set({ loaded: true });
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ userId: null, ids: [], loaded: true });
      return;
    }
    const { data } = await supabase.from('favorites').select('product_id').eq('user_id', user.id);
    set({ userId: user.id, ids: (data ?? []).map((r) => r.product_id), loaded: true });
  },

  toggle: async (productId) => {
    const { userId, ids } = get();
    if (!userId) {
      toast.info('سجّل الدخول لإضافة المفضلة');
      return;
    }
    const supabase = createClient();
    if (ids.includes(productId)) {
      set({ ids: ids.filter((x) => x !== productId) });
      await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
    } else {
      set({ ids: [...ids, productId] });
      await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
      toast.success('أُضيف للمفضلة');
    }
  },

  isFav: (productId) => get().ids.includes(productId),
}));
