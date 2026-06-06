'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { CartButton } from './CartButton';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/menu', label: 'المنيو' },
  { href: '/offers', label: 'العروض' },
  { href: '/track', label: 'تتبع الطلب' },
  { href: '/about', label: 'من نحن' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-shadow',
        scrolled ? 'glass shadow-card' : 'bg-cream',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-bold transition',
                  active ? 'bg-brand-red text-white' : 'text-ink hover:bg-ink/5',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/menu" className="btn-primary btn-sm hidden sm:inline-flex">
            اطلب الآن
          </Link>
          <CartButton />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {open && (
        <div className="animate-fade-in border-t border-line bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-xl px-4 py-3 text-base font-bold transition',
                    active ? 'bg-brand-red text-white' : 'text-ink hover:bg-ink/5',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href="/menu" className="btn-primary mt-2">
              اطلب الآن
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
