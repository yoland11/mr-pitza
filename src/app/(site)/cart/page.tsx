import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { CrossSell } from '@/components/menu/CrossSell';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getCrossSell, getSettings } from '@/lib/data/queries';

export const metadata: Metadata = { title: 'السلة', robots: { index: false } };

export default async function CartPage() {
  const [settings, cross] = await Promise.all([getSettings(), getCrossSell([], 4)]);
  return (
    <div className="container-page py-10">
      <SectionHeading eyebrow="مراجعة الطلب" title="سلة المشتريات" />
      <CartView settings={settings} />
      <CrossSell products={cross} title="أكمل وجبتك 🍟🥤" />
    </div>
  );
}
