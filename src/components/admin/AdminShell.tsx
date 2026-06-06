'use client';

import {
  GalleryHorizontalEnd,
  LayoutDashboard,
  LogOut,
  Menu,
  Pizza,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Ticket,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NewOrdersWatcher } from '@/components/admin/NewOrdersWatcher';
import { useAdminNotify } from '@/lib/store/adminNotify';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'لوحة التحكم', Icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'الطلبات', Icon: ShoppingBag },
  { href: '/admin/menu', label: 'المنيو', Icon: Pizza },
  { href: '/admin/categories', label: 'الأقسام', Icon: Tag },
  { href: '/admin/coupons', label: 'الكوبونات', Icon: Ticket },
  { href: '/admin/banners', label: 'البانرات', Icon: GalleryHorizontalEnd },
  { href: '/admin/reviews', label: 'التقييمات', Icon: Star },
  { href: '/admin/settings', label: 'الإعدادات', Icon: Settings },
];

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const newCount = useAdminNotify((s) => s.newCount);
  const soundEnabled = useAdminNotify((s) => s.soundEnabled);
  const toggleSound = useAdminNotify((s) => s.toggleSound);
  useEffect(() => setMounted(true), []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-red text-white">
          <Pizza className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-extrabold text-white">مستر بيتزا</p>
          <p className="text-[11px] font-bold text-brand-yellow">لوحة الإدارة</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                active ? 'bg-brand-red text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              {href === '/admin/orders' && mounted && newCount > 0 && (
                <span
                  className={cn(
                    'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-extrabold',
                    active ? 'bg-white text-brand-red' : 'bg-brand-red text-white',
                  )}
                >
                  {newCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <p className="truncate px-2 pb-2 text-xs text-white/50" dir="ltr">{email}</p>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/70 transition hover:bg-brand-red hover:text-white">
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream lg:flex">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-ink lg:block">{SidebarContent}</aside>

      {/* الشريط الجانبي — الموبايل */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-64 bg-ink lg:hidden">{SidebarContent}</aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 lg:hidden" aria-label="القائمة">
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/admin/orders" className="relative grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-brand-red hover:text-white" aria-label="الطلبات الجديدة">
              <ShoppingBag className="h-5 w-5" />
              {mounted && newCount > 0 && (
                <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-red px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
                  {newCount}
                </span>
              )}
            </Link>
            <span className="hidden text-sm font-bold text-ink-muted sm:inline">
              {mounted && newCount > 0 ? `${newCount} طلب جديد` : 'إدارة المطعم'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={cn('grid h-10 w-10 place-items-center rounded-xl', soundEnabled ? 'bg-brand-yellow/20 text-brand-yellow-dark' : 'bg-ink/5 text-ink-muted')}
              title={soundEnabled ? 'صوت التنبيه مفعّل' : 'صوت التنبيه متوقف'}
              aria-label="تبديل صوت التنبيه"
            >
              {mounted && soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <Link href="/" target="_blank" className="text-sm font-bold text-brand-red hover:underline">
              عرض الموقع ↗
            </Link>
          </div>
        </header>
        <NewOrdersWatcher />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
