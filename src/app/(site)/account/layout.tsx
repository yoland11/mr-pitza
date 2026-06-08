import { redirect } from 'next/navigation';
import { AccountShell } from '@/components/account/AccountShell';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect('/login');
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account');

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const name = profile?.full_name ?? user.user_metadata?.full_name ?? '';

  return <AccountShell name={name}>{children}</AccountShell>;
}
