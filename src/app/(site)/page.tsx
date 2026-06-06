import { Hero } from '@/components/home/Hero';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { Reviews } from '@/components/home/Reviews';
import { InfoStrip } from '@/components/home/InfoStrip';
import { ProductCard } from '@/components/menu/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  getApprovedReviews,
  getCategories,
  getDiscountedProducts,
  getFeaturedProducts,
  getSettings,
} from '@/lib/data/queries';

export const revalidate = 60;

export default async function HomePage() {
  const [settings, categories, featured, offers, reviews] = await Promise.all([
    getSettings(),
    getCategories(),
    getFeaturedProducts(),
    getDiscountedProducts(),
    getApprovedReviews(8),
  ]);

  const reviewCards = reviews.map((r) => ({
    id: r.id,
    name: r.customer_name || 'زبون',
    rating: r.rating,
    text: r.comment || 'تجربة رائعة!',
    city: settings.city,
  }));

  return (
    <>
      <Hero settings={settings} />

      {/* أقسام الأكلات */}
      <section className="container-page py-12 lg:py-16">
        <SectionHeading eyebrow="تصفّح حسب الرغبة" title="أقسام الأكلات" href="/menu" />
        <CategoryGrid categories={categories} />
      </section>

      {/* أقوى العروض */}
      {offers.length > 0 && (
        <section className="bg-white py-12 lg:py-16">
          <div className="container-page">
            <SectionHeading eyebrow="وفّر أكثر" title="أقوى العروض" href="/offers" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {offers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* أشهر الوجبات */}
      <section className="container-page py-12 lg:py-16">
        <SectionHeading eyebrow="الأكثر طلباً" title="أشهر الوجبات" href="/menu" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* شريط دعوة لتحميل التطبيق / الطلب */}
      <section className="container-page">
        <div className="bg-brand-gradient relative overflow-hidden rounded-4xl px-6 py-10 text-center text-white sm:px-10 sm:py-14">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-2xl font-black sm:text-4xl">جائع؟ بيتزتك على بُعد نقرة واحدة 🍕</h2>
            <p className="mt-3 text-white/85">اطلب الآن واستمتع بأشهى الأطباق مع توصيل سريع داخل المدينة والقضاء.</p>
            <a href="/menu" className="btn-accent mt-6 inline-flex">اطلب الآن</a>
          </div>
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -right-6 h-48 w-48 rounded-full bg-black/10" />
        </div>
      </section>

      {/* تقييمات العملاء */}
      <section className="container-page py-12 lg:py-16">
        <SectionHeading eyebrow="ماذا قالوا عنّا" title="تقييمات العملاء" />
        <Reviews items={reviewCards} />
      </section>

      {/* أوقات العمل والموقع */}
      <section className="container-page pb-4">
        <SectionHeading eyebrow="زورونا" title="أوقات العمل والموقع" />
        <InfoStrip settings={settings} />
      </section>
    </>
  );
}
