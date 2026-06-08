import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { CouponCard } from '@/components/offers/CouponCard';
import { ProductCard } from '@/components/menu/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { getCategories, getCoupons, getProducts } from '@/lib/data/queries';

export const metadata: Metadata = {
  title: 'العروض والكوبونات',
  description: 'عروض يومية، كوبونات خصم، وجبات كومبو وعروض عائلية من مستر بيتزا.',
};

export const revalidate = 60;

export default async function OffersPage() {
  const [products, coupons, categories] = await Promise.all([
    getProducts(),
    getCoupons(),
    getCategories(),
  ]);

  const dailyOffers = products.filter((p) => p.discount_price != null && p.is_available);
  const familyCat = categories.find((c) => c.slug === 'family');
  const familyMeals = familyCat ? products.filter((p) => p.category_id === familyCat.id) : [];

  // أقرب عرض ينتهي (للعد التنازلي)
  const soonestEnd = dailyOffers
    .map((p) => p.offer_ends_at)
    .filter((d): d is string => !!d && new Date(d) > new Date())
    .sort()[0];

  return (
    <div className="container-page py-10">
      {/* بطل العروض */}
      <div className="bg-brand-gradient relative mb-10 overflow-hidden rounded-4xl px-6 py-12 text-center text-white sm:py-16">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-brand-yellow" />
        <h1 className="text-3xl font-black sm:text-5xl">عروض مستر بيتزا</h1>
        <p className="mx-auto mt-3 max-w-md text-white/85">خصومات يومية، كوبونات حصرية، ووجبات عائلية بأسعار لا تُقاوم.</p>
        {soonestEnd && (
          <div className="relative z-10 mt-5 flex justify-center">
            <CountdownTimer endsAt={soonestEnd} label="أسرع! ينتهي العرض خلال" className="bg-white/95" />
          </div>
        )}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -right-6 h-48 w-48 rounded-full bg-black/10" />
      </div>

      {/* الكوبونات */}
      {coupons.length > 0 && (
        <section className="mb-12">
          <SectionHeading eyebrow="انسخ واستخدم" title="كوبونات الخصم" />
          <div className="grid gap-4 md:grid-cols-2">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        </section>
      )}

      {/* عروض يومية */}
      {dailyOffers.length > 0 && (
        <section className="mb-12">
          <SectionHeading eyebrow="وفّر اليوم" title="عروض يومية وكومبو" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {dailyOffers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* وجبات عائلية */}
      {familyMeals.length > 0 && (
        <section>
          <SectionHeading eyebrow="تكفي الجميع" title="عروض عائلية" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {familyMeals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
