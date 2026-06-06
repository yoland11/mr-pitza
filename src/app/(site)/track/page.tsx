import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackView } from '@/components/track/TrackView';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'تتبع الطلب',
  description: 'تابع حالة طلبك من مستر بيتزا عبر كود الطلب أو رقم الهاتف.',
};

export default function TrackPage() {
  return (
    <div className="container-page py-10">
      <SectionHeading eyebrow="أين طلبي؟" title="تتبّع طلبك" />
      <Suspense fallback={<div className="skeleton mx-auto h-48 max-w-2xl rounded-2xl" />}>
        <TrackView />
      </Suspense>
    </div>
  );
}
