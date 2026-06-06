import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { getSettings } from '@/lib/data/queries';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {!settings.is_open && (
        <div className="bg-ink px-4 py-2.5 text-center text-sm font-bold text-white">
          🔴 {settings.closed_message || 'عذراً، المطعم مغلق حالياً. نعود قريباً!'}
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton number={settings.whatsapp} />
    </div>
  );
}
