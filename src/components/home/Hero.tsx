import { ArrowLeft, Clock, Star, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { RestaurantSettings } from '@/lib/types';

export function Hero({ settings }: { settings: RestaurantSettings }) {
  return (
    <section className="relative overflow-hidden bg-hero-glow text-white">
      <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        {/* النص */}
        <div className="animate-fade-up text-center lg:text-right">
          <span className="badge-yellow mb-5 inline-flex">
            <Star className="h-3.5 w-3.5" fill="currentColor" />
            ألذ بيتزا في {settings.city}
          </span>
          <h1 className="text-balance text-4xl font-black leading-[1.15] sm:text-5xl lg:text-6xl">
            طعم لا يُقاوم
            <span className="mt-2 block text-brand-yellow">من فرننا إلى بابك 🍕</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/80 lg:mx-0 lg:text-lg">
            عجينة طازجة يومياً، جبنة وفيرة، ومكوّنات منتقاة. اطلب الآن واستمتع بتوصيل سريع داخل المدينة والقضاء.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/menu" className="btn-accent w-full sm:w-auto">
              اطلب الآن
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/menu" className="btn w-full border-2 border-white/25 bg-white/5 text-white hover:bg-white/15 sm:w-auto">
              تصفّح المنيو
            </Link>
          </div>

          {/* مزايا سريعة */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/80 lg:justify-start">
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-brand-yellow" /> توصيل سريع</span>
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-brand-yellow" /> {settings.is_open ? 'مفتوح الآن' : 'مغلق حالياً'}</span>
            <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-brand-yellow" fill="currentColor" /> تقييم 4.9</span>
          </div>
        </div>

        {/* الصورة */}
        <div className="relative mx-auto max-w-md lg:max-w-none">
          <div className="absolute inset-0 -z-0 scale-90 rounded-full bg-brand-red/30 blur-3xl" />
          <div className="animate-float relative aspect-square overflow-hidden rounded-4xl ring-4 ring-white/10 shadow-card-hover">
            <Image
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=80"
              alt="بيتزا مستر بيتزا"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 500px"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-ink shadow-card-hover">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-yellow text-xl">🔥</span>
            <div className="leading-tight">
              <p className="text-xs text-ink-muted">عرض اليوم</p>
              <p className="text-sm font-extrabold">خصم حتى 25%</p>
            </div>
          </div>
        </div>
      </div>

      {/* موجة سفلية */}
      <div className="h-6 w-full bg-cream" style={{ clipPath: 'ellipse(75% 100% at 50% 100%)' }} />
    </section>
  );
}
