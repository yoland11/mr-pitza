'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-ink/5 p-1">
      <button
        type="button"
        aria-label="إنقاص"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn('grid place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-brand-red hover:text-white disabled:opacity-40', btn)}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn('min-w-8 text-center font-extrabold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
        {value}
      </span>
      <button
        type="button"
        aria-label="زيادة"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn('grid place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-brand-red hover:text-white disabled:opacity-40', btn)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
