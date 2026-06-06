import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // وضع المعاينة: Supabase غير مضبوط
  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-4">
        <div className="card max-w-lg p-8 text-center">
          <span className="text-5xl">⚙️</span>
          <h1 className="mt-4 text-xl font-black text-ink">لوحة الإدارة تتطلب Supabase</h1>
          <p className="mt-2 text-sm text-ink-muted">
            لتفعيل لوحة الإدارة: انسخ <code>.env.example</code> إلى <code>.env.local</code> واملأ مفاتيح Supabase،
            ثم نفّذ ملف <code>supabase/schema.sql</code>، وأنشئ مستخدم المدير.
          </p>
          <Link href="/" className="btn-primary mt-5">العودة للموقع</Link>
        </div>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  // التحقق من صلاحية الإدارة
  const { data: profile } = await supabase.from('users').select('id, role').eq('id', user.id).single();
  if (!profile) {
    redirect('/admin/login?error=forbidden');
  }

  return <AdminShell email={user.email ?? ''}>{children}</AdminShell>;
}
