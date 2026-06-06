/** قراءة إعدادات Supabase والتحقق من توفّرها */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** هل تم ضبط Supabase؟ يُستخدم لتفعيل بيانات المعاينة عند غياب الإعداد */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;
