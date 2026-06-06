import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/types';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/menu?cat=${cat.slug}`}
          className="group card flex flex-col items-center p-3 text-center transition-all hover:-translate-y-1 hover:shadow-card-hover"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-line">
            {cat.image_url ? (
              <Image
                src={cat.image_url}
                alt={cat.name}
                fill
                sizes="140px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="grid h-full place-items-center text-3xl">🍴</div>
            )}
          </div>
          <span className="mt-2.5 text-sm font-extrabold text-ink group-hover:text-brand-red">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
