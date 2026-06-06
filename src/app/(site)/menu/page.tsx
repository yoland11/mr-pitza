import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MenuView } from '@/components/menu/MenuView';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { getCategories, getProducts } from '@/lib/data/queries';

export const metadata: Metadata = {
  title: 'المنيو',
  description: 'تصفّح منيو مستر بيتزا: بيتزا، برغر، سندويش، مقبلات، مشروبات، عروض ووجبات عائلية.',
};

export const revalidate = 60;

async function MenuContent() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return <MenuView categories={categories} products={products} />;
}

export default function MenuPage() {
  return (
    <div className="container-page py-10">
      <SectionHeading eyebrow="كل ما تشتهيه" title="المنيو الكامل" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <MenuContent />
      </Suspense>
    </div>
  );
}
