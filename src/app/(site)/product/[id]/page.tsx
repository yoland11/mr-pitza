import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductConfigurator } from '@/components/product/ProductConfigurator';
import { ProductGallery } from '@/components/product/ProductGallery';
import { getProductById } from '@/lib/data/queries';
import { discountPercent, effectivePrice, formatPrice } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'المنتج غير موجود' };
  return {
    title: product.name,
    description: product.description ?? `اطلب ${product.name} من مستر بيتزا`,
    openGraph: { images: product.image_url ? [product.image_url] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const price = effectivePrice(product);
  const off = discountPercent(product);

  return (
    <div className="container-page py-6 lg:py-10">
      {/* مسار التنقّل */}
      <nav className="mb-5 flex items-center gap-1 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-red">الرئيسية</Link>
        <ChevronLeft className="h-4 w-4" />
        <Link href="/menu" className="hover:text-brand-red">المنيو</Link>
        <ChevronLeft className="h-4 w-4" />
        <span className="font-bold text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* معرض الصور */}
        <ProductGallery
          images={product.images ?? []}
          fallbackUrl={product.image_url}
          name={product.name}
          off={off}
          available={product.is_available}
        />

        {/* التفاصيل والإعداد */}
        <div>
          {product.category && <span className="badge-soft mb-3">{product.category.name}</span>}
          <h1 className="text-3xl font-black text-ink sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-black text-brand-red">{formatPrice(price)}</span>
            {off > 0 && (
              <span className="pb-1 text-lg font-bold text-ink-muted line-through">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-4 text-base leading-relaxed text-ink/80">{product.description}</p>
          )}

          <div className="mt-6 border-t border-line pt-6">
            <ProductConfigurator product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
