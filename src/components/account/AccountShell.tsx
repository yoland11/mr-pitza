'use client';

import { Heart, LogOut, MapPin, Receipt, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFavorites } from '@/lib/store/favorites';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/account', label: 'نظرة عامة', Icon: User, exact: true },
  { href: '/account/profile', label: 'معلوماتي', Icon: User },
  { href: '/account/addresses', label: 'عناويني', Icon: MapPin },
  { href: '/account/orders', label: 'طلباتي', Icon: Receipt },
  { href: '/account/favorites', label: 'المفضلة', Icon: Heart },
  { href: '/account/points', label: 'النقاط والمكافآت', Icon: Sparkles },
];

export function AccountShell({ children, name }: { children: React.ReactNode; name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // إعادة تعيين المفضلة محلياً
    useFavorites.setState({ ids: [], userId: null, loaded: false });
    router.replace('/');
    router.refresh();
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink sm:text-3xl">حسابي</h1>
        <p className="mt-1 text-ink-muted">مرحباً {name || 'بك'} 👋</p>
        <div className="accent-bar mt-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* التنقّل */}
        <aside>
          <div className="card p-2">
            <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
              {NAV.map(({ href, label, Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                      active ? 'bg-brand-red text-white' : 'text-ink hover:bg-ink/5',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={signOut}
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-brand-red hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
