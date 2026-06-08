'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function diff(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function CountdownTimer({
  endsAt,
  label = 'ينتهي خلال',
  className,
}: {
  endsAt: string;
  label?: string;
  className?: string;
}) {
  const [t, setT] = useState<ReturnType<typeof diff>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setT(diff(endsAt));
    const id = setInterval(() => setT(diff(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!mounted || !t) return null;

  const cell = (val: number, unit: string) => (
    <div className="flex flex-col items-center">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-base font-black tabular-nums text-white">
        {String(val).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-bold text-ink-muted">{unit}</span>
    </div>
  );

  return (
    <div className={cn('inline-flex items-center gap-3 rounded-2xl bg-brand-yellow/15 px-4 py-2.5', className)}>
      <span className="flex items-center gap-1 text-sm font-extrabold text-brand-red">
        <Clock className="h-4 w-4" /> {label}
      </span>
      <div className="flex items-center gap-1.5">
        {t.days > 0 && cell(t.days, 'يوم')}
        {cell(t.hours, 'ساعة')}
        {cell(t.minutes, 'دقيقة')}
        {cell(t.seconds, 'ثانية')}
      </div>
    </div>
  );
}
