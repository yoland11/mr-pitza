import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import type { UserRole } from '@/lib/types';

export interface StaffSession {
  userId: string;
  email: string;
  role: UserRole;
}

/** يرجع جلسة الطاقم الحالية مع الدور، أو null إن لم يكن مسجّلاً/غير موظف */
export async function getStaffSession(): Promise<StaffSession | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!data) return null;
  return { userId: user.id, email: user.email ?? '', role: data.role as UserRole };
}

/** هل الدور ضمن المسموح؟ */
export function roleAllowed(role: UserRole | undefined, allowed: UserRole[]): boolean {
  return !!role && allowed.includes(role);
}
