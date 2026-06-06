'use client';

import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useToast } from '@/lib/store/toast';
import { cn } from '@/lib/utils';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-green-600 text-white',
  error: 'bg-brand-red text-white',
  info: 'bg-ink text-white',
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'animate-fade-up flex items-center gap-3 rounded-2xl px-4 py-3 shadow-card-hover',
              STYLES[t.type],
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-bold">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="إغلاق" className="opacity-80 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
