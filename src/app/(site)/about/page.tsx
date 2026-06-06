import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Facebook, Instagram, Leaf, Timer, Truck } from 'lucide-react';
import { InfoStrip } from '@/components/home/InfoStrip';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getSettings } from '@/lib/data/queries';

export const metadata: Metadata = {
  title: 'من نحن',
  description: 'تعرّف على قصة مستر بيتزا، قيمنا، أوقات عملنا وموقعنا.',
};

const gallery = [
  'photo-1513104890138-7c749659a591',
  'photo-1571997478779-2adcbbe9ab2f',
  'photo-1593504049359-74330189a345',
  'photo-1604382354936-07c5d9983bd3',
];

const values = [
  { Icon: Leaf, title: 'مكوّنات طازجة', desc: 'نختار أجود المكوّنات يومياً' },
  { Icon: Timer, title: 'تحضير سريع', desc: 'طلبك جاهز في أسرع وقت' },
  { Icon: Truck, title: 'توصيل موثوق', desc: 'داخل المدينة والقضاء' },
  { Icon: Award, title: 'جودة مضمونة', desc: 'طعم يرضي جميع الأذواق' },
];

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-10">
      {/* القصة */}
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <span className="badge-red mb-3">قصتنا</span>
          <h1 className="text-3xl font-black text-ink sm:text-4xl">عن مستر بيتزا</h1>
          <div className="accent-bar mt-3" />
          <p className="mt-5 leading-loose text-ink/80">
            بدأت رحلة <strong>مستر بيتزا</strong> بشغفٍ بسيط: تقديم بيتزا وأكلات سريعة بطعمٍ أصيل
            ومكوّنات طازجة لأهل {settings.city}. نخبز عجينتنا يومياً، ونختار جبنتنا ومكوّناتنا بعناية،
            لنمنحك تجربة لذيذة في كل قضمة.
          </p>
          <p className="mt-3 leading-loose text-ink/80">
            اليوم أصبحنا الوجهة المفضّلة لمحبّي البيتزا والبرغر، بخدمة سريعة وتوصيل موثوق داخل المدينة
            والقضاء. هدفنا أن نضع البسمة على وجوهكم مع كل طلب.
          </p>
          <Link href="/menu" className="btn-primary mt-6">تصفّح المنيو</Link>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-4xl shadow-card">
          <Image
            src="https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=1000&q=80"
            alt="مطعم مستر بيتزا"
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        </div>
      </div>

      {/* القيم */}
      <section className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {values.map(({ Icon, title, desc }) => (
          <div key={title} className="card p-5 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-red/10 text-brand-red">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-base font-extrabold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{desc}</p>
          </div>
        ))}
      </section>

      {/* صور المطعم */}
      <section className="mt-14">
        <SectionHeading eyebrow="أجواؤنا" title="صور من المطعم" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {gallery.map((id) => (
            <div key={id} className="relative aspect-square overflow-hidden rounded-2xl bg-line">
              <Image
                src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`}
                alt="مستر بيتزا"
                fill
                sizes="(max-width: 768px) 50vw, 280px"
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </section>

      {/* أوقات العمل والموقع */}
      <section className="mt-14">
        <SectionHeading eyebrow="زورونا" title="أوقات العمل والموقع" />
        <InfoStrip settings={settings} />
      </section>

      {/* روابط التواصل */}
      <section className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {settings.facebook_url && (
          <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <Facebook className="h-5 w-5" /> فيسبوك
          </a>
        )}
        {settings.instagram_url && (
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <Instagram className="h-5 w-5" /> انستغرام
          </a>
        )}
      </section>
    </div>
  );
}
