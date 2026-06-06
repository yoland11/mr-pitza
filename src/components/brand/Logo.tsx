import { Pizza } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-brand-red text-white shadow-card transition-transform group-hover:-rotate-6">
        <Pizza className="h-6 w-6" strokeWidth={2.4} />
        <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-brand-yellow ring-2 ring-white" />
      </span>
      <span className="leading-none">
        <span className={cn('block font-display text-xl font-extrabold', light ? 'text-white' : 'text-ink')}>
          مستر بيتزا
        </span>
        <span className={cn('block text-[11px] font-bold tracking-widest', light ? 'text-brand-yellow' : 'text-brand-red')}>
          MR PIZZA
        </span>
      </span>
    </Link>
  );
}
