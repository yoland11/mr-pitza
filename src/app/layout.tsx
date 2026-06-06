import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/Toaster';
import { PWARegister } from '@/components/system/PWARegister';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'مستر بيتزا | Mr Pizza — ألذ بيتزا وأكلات سريعة',
    template: '%s | مستر بيتزا',
  },
  description:
    'مستر بيتزا — مطعم عصري للبيتزا والأكلات السريعة. عجينة طازجة، برغر، سندويش ومقبلات. اطلب الآن مع توصيل سريع داخل المدينة والقضاء.',
  keywords: ['بيتزا', 'مطعم', 'برغر', 'توصيل', 'أكلات سريعة', 'Mr Pizza', 'مستر بيتزا'],
  manifest: '/manifest.webmanifest',
  applicationName: 'مستر بيتزا',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'مستر بيتزا' },
  openGraph: {
    type: 'website',
    locale: 'ar_IQ',
    siteName: 'مستر بيتزا',
    title: 'مستر بيتزا | Mr Pizza',
    description: 'ألذ بيتزا وأكلات سريعة — اطلب الآن مع توصيل سريع.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'مستر بيتزا' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مستر بيتزا | Mr Pizza',
    description: 'ألذ بيتزا وأكلات سريعة — اطلب الآن.',
  },
  icons: { icon: '/icon.svg', apple: '/icon.svg', shortcut: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#e11221',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen">
        {children}
        <Toaster />
        <PWARegister />
      </body>
    </html>
  );
}
