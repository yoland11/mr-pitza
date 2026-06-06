import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import type { RestaurantSettings } from '@/lib/types';

export function InfoStrip({ settings }: { settings: RestaurantSettings }) {
  const lat = settings.latitude ?? 33.3152;
  const lon = settings.longitude ?? 44.3661;
  const d = 0.01;
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const directions = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* أوقات العمل وحالة المطعم */}
      <div className="card flex flex-col gap-5 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-yellow/20 text-brand-yellow-dark">
            <Clock className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-lg text-ink">أوقات العمل</h3>
            <p className="text-sm text-ink-muted">{settings.working_hours}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
          <span className="text-sm font-bold text-ink">حالة المطعم الآن</span>
          <span className={`badge ${settings.is_open ? 'badge-yellow' : 'badge-red'}`}>
            {settings.is_open ? '● مفتوح' : '● مغلق'}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <a href={`tel:${settings.phone}`} className="flex items-center gap-2 text-ink hover:text-brand-red">
            <Phone className="h-4 w-4 text-brand-red" />
            <span dir="ltr">{settings.phone}</span>
          </a>
          <p className="flex items-start gap-2 text-ink-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            {settings.address} — {settings.city}
          </p>
        </div>
      </div>

      {/* الموقع على الخريطة */}
      <div className="card overflow-hidden">
        <div className="relative h-64 w-full bg-line lg:h-full">
          <iframe
            title="موقع المطعم"
            src={mapSrc}
            className="h-full min-h-64 w-full border-0"
            loading="lazy"
          />
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sm absolute bottom-3 left-3 right-3 justify-center"
          >
            <Navigation className="h-4 w-4" />
            احصل على الاتجاهات
          </a>
        </div>
      </div>
    </div>
  );
}
