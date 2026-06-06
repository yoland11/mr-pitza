import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getSettings } from '@/lib/data/queries';

export const metadata: Metadata = { title: 'السلة', robots: { index: false } };

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="container-page py-10">
      <SectionHeading eyebrow="مراجعة الطلب" title="سلة المشتريات" />
      <CartView settings={settings} />
    </div>
  );
}
