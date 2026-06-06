import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

/**
 * عميل بصلاحيات الخدمة — للاستخدام داخل API Routes فقط (الخادم).
 * يتجاوز RLS لإنشاء الطلبات والكتابة الآمنة. لا تستورده في أي مكوّن عميل.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
