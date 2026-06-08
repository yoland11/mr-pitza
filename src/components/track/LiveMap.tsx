'use client';

import { Bike, Clock, Navigation } from 'lucide-react';

export function LiveMap({
  driverLat,
  driverLng,
  custLat,
  custLng,
  eta,
  updatedAt,
}: {
  driverLat: number;
  driverLng: number;
  custLat: number | null;
  custLng: number | null;
  eta: number | null;
  updatedAt: string | null;
}) {
  // إطار الخريطة يشمل السائق (والزبون إن توفّر)
  const lats = [driverLat, ...(custLat != null ? [custLat] : [])];
  const lngs = [driverLng, ...(custLng != null ? [custLng] : [])];
  const pad = 0.006;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${driverLat},${driverLng}`;
  const directions =
    custLat != null && custLng != null
      ? `https://www.google.com/maps/dir/?api=1&origin=${driverLat},${driverLng}&destination=${custLat},${custLng}`
      : `https://www.google.com/maps/search/?api=1&query=${driverLat},${driverLng}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line p-4">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <Bike className="h-5 w-5 text-brand-red" /> سائقك في الطريق
        </h3>
        {eta != null && (
          <span className="badge-yellow"><Clock className="h-3.5 w-3.5" /> ~{eta} دقيقة</span>
        )}
      </div>
      <div className="relative h-64 w-full bg-line">
        <iframe title="موقع السائق" src={src} className="h-full w-full border-0" loading="lazy" />
        <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm absolute bottom-3 left-3 right-3 justify-center">
          <Navigation className="h-4 w-4" /> فتح المسار على الخريطة
        </a>
      </div>
      {updatedAt && (
        <p className="px-4 py-2 text-center text-xs text-ink-muted">
          آخر تحديث للموقع: {new Date(updatedAt).toLocaleTimeString('ar')}
        </p>
      )}
    </div>
  );
}
