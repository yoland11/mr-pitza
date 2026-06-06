'use client';

import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/utils';

export function WhatsAppButton({ number }: { number: string }) {
  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, 'مرحباً مستر بيتزا، أريد الاستفسار عن طلب 🍕')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-card-hover transition hover:scale-105"
    >
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#25D366]/60" />
      <MessageCircle className="relative h-7 w-7" fill="white" strokeWidth={0} />
    </a>
  );
}
