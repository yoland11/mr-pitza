import { Quote, Star } from 'lucide-react';
import { seedReviews } from '@/lib/data/seed';

export interface ReviewCard {
  id: string;
  name: string;
  rating: number;
  text: string;
  city: string;
}

export function Reviews({ items }: { items?: ReviewCard[] }) {
  const reviews = items && items.length > 0 ? items : seedReviews;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {reviews.map((r) => (
        <figure key={r.id} className="card flex flex-col p-5">
          <Quote className="h-7 w-7 text-brand-yellow" />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/90">{r.text}</blockquote>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <div>
              <figcaption className="text-sm font-extrabold text-ink">{r.name}</figcaption>
              <p className="text-xs text-ink-muted">{r.city}</p>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={i < r.rating ? 'h-4 w-4 text-brand-yellow' : 'h-4 w-4 text-line'}
                  fill="currentColor"
                />
              ))}
            </div>
          </div>
        </figure>
      ))}
    </div>
  );
}
