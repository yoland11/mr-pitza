import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvoiceView } from '@/components/invoice/InvoiceView';
import { getOrderById } from '@/lib/data/orders';
import { getSettings } from '@/lib/data/queries';

export const metadata: Metadata = { title: 'الفاتورة', robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderById(id), getSettings()]);
  if (!order) notFound();
  return <InvoiceView order={order} settings={settings} />;
}
