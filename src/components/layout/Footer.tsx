import { Clock, Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import type { RestaurantSettings } from '@/lib/types';

export function Footer({ settings }: { settings: RestaurantSettings }) {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            ألذ بيتزا وأكلات سريعة في {settings.city}. عجينة طازجة يومياً، توصيل سريع داخل المدينة والقضاء.
          </p>
          <div className="mt-5 flex gap-2">
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brand-red">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="انستغرام" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brand-red">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg text-brand-yellow">روابط سريعة</h4>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li><Link href="/menu" className="hover:text-white">المنيو</Link></li>
            <li><Link href="/offers" className="hover:text-white">العروض</Link></li>
            <li><Link href="/track" className="hover:text-white">تتبع الطلب</Link></li>
            <li><Link href="/cart" className="hover:text-white">السلة</Link></li>
            <li><Link href="/about" className="hover:text-white">من نحن</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg text-brand-yellow">تواصل معنا</h4>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              <a href={`tel:${settings.phone}`} dir="ltr" className="hover:text-white">{settings.phone}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              <span>{settings.address} — {settings.city}</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              <span>{settings.working_hours}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg text-brand-yellow">حالة المطعم</h4>
          <span className={`badge ${settings.is_open ? 'badge-yellow' : 'badge-red'}`}>
            {settings.is_open ? 'مفتوح الآن' : 'مغلق حالياً'}
          </span>
          <p className="mt-4 text-sm text-white/70">رسوم التوصيل داخل المدينة / القضاء: {settings.delivery_fee.toLocaleString('en-US')} د.ع</p>
          <Link href="/menu" className="btn-accent btn-sm mt-5">اطلب الآن</Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} مستر بيتزا — جميع الحقوق محفوظة.</p>
          <p>صُمّم بحب 🍕 للأكلات اللذيذة</p>
        </div>
      </div>
    </footer>
  );
}
