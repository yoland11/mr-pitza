import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getSettings } from '@/lib/data/queries';

export const metadata: Metadata = { title: 'إتمام الطلب', robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-page py-10">
      <SectionHeading eyebrow="الخطوة الأخيرة" title="إتمام الطلب" />
      <CheckoutForm settings={settings} />
    </div>
  );
}
