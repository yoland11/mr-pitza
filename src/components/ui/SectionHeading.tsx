import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function SectionHeading({
  eyebrow,
  title,
  href,
  hrefLabel = 'عرض الكل',
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="mb-2 inline-block text-sm font-extrabold uppercase tracking-wide text-brand-red">
            {eyebrow}
          </span>
        )}
        <h2 className="section-title text-ink">{title}</h2>
        <div className="accent-bar mt-3" />
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1 text-sm font-bold text-brand-red hover:text-brand-red-dark sm:inline-flex">
          {hrefLabel}
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  );
}
