import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import type { Banner, Category, Coupon, Product, RestaurantSettings, Review } from '@/lib/types';
import {
  seedBanners,
  seedCategories,
  seedCoupons,
  seedProducts,
  seedSettings,
} from './seed';

/**
 * طبقة الوصول للبيانات (جانب الخادم).
 * إن لم يُضبط Supabase تُستخدم بيانات المعاينة كي يبقى الموقع قابلاً للعرض.
 */

export async function getSettings(): Promise<RestaurantSettings> {
  if (!isSupabaseConfigured) return seedSettings;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from('restaurant_settings').select('*').limit(1).single();
  return (data as RestaurantSettings) ?? seedSettings;
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return seedCategories;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return (data as Category[]) ?? seedCategories;
}

const PRODUCT_SELECT_FULL =
  '*, category:categories(*), sizes:product_sizes(*), addons:product_addons(*), images:product_images(*)';
const PRODUCT_SELECT_BASE =
  '*, category:categories(*), sizes:product_sizes(*), addons:product_addons(*)';

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return seedProducts;
  const supabase = await createServerSupabase();
  // محاولة مع جدول الصور؛ وإن لم يُطبّق الترحيل بعد نرجع بدون صور (دون كسر الصفحة)
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT_FULL).order('sort_order');
  if (error) {
    const { data: base } = await supabase.from('products').select(PRODUCT_SELECT_BASE).order('sort_order');
    return (base as Product[]) ?? [];
  }
  return (data as Product[]) ?? [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.is_featured && p.is_available).slice(0, 8);
}

export async function getDiscountedProducts(): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.discount_price != null && p.is_available).slice(0, 8);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    return seedProducts.find((p) => p.id === id || p.slug === id) ?? null;
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_FULL)
    .or(`id.eq.${id},slug.eq.${id}`)
    .limit(1)
    .single();
  if (error) {
    const { data: base } = await supabase
      .from('products')
      .select(PRODUCT_SELECT_BASE)
      .or(`id.eq.${id},slug.eq.${id}`)
      .limit(1)
      .single();
    return (base as Product) ?? null;
  }
  return (data as Product) ?? null;
}

export async function getCoupons(): Promise<Coupon[]> {
  if (!isSupabaseConfigured) return seedCoupons;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (data as Coupon[]) ?? seedCoupons;
}

export async function getApprovedReviews(limit = 8): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as Review[]) ?? [];
}

export async function getBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) return seedBanners;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return (data as Banner[]) ?? seedBanners;
}
