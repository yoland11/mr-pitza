import { Heart, Receipt, Sparkles, Truck } from 'lucide-react';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { LOYALTY } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AccountOverview() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { count: ordersCount }, { count: activeCount }, { count: favCount }] =
    await Promise.all([
      supabase.from('profiles').select('points, full_name').eq('id', user.id).single(),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .not('status', 'in', '(delivered,cancelled)'),
      supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

  const points = profile?.points ?? 0;
  const rewardValue = Math.floor(points / LOYALTY.POINTS_PER_REWARD) * LOYALTY.REWARD_VALUE;

  const cards = [
    { label: 'نقاطي', value: `${points} نقطة`, hint: rewardValue > 0 ? `تعادل ${formatPrice(rewardValue)}` : 'اجمع أكثر', Icon: Sparkles, href: '/account/points', color: 'bg-brand-yellow text-ink' },
    { label: 'إجمالي طلباتي', value: String(ordersCount ?? 0), hint: 'عرض السجل', Icon: Receipt, href: '/account/orders', color: 'bg-brand-red text-white' },
    { label: 'طلبات حالية', value: String(activeCount ?? 0), hint: 'قيد التنفيذ', Icon: Truck, href: '/account/orders', color: 'bg-ink text-white' },
    { label: 'المفضلة', value: String(favCount ?? 0), hint: 'منتجاتي', Icon: Heart, href: '/account/favorites', color: 'bg-green-600 text-white' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, hint, Icon, href, color }) => (
          <Link key={label} href={href} className="card p-5 transition hover:-translate-y-1 hover:shadow-card-hover">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-3 text-xs text-ink-muted">{label}</p>
            <p className="text-xl font-black text-ink">{value}</p>
            <p className="text-xs font-bold text-brand-red">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="card bg-brand-gradient p-6 text-white">
        <h2 className="text-xl font-black">برنامج الولاء 🎁</h2>
        <p className="mt-2 text-white/85">
          كل {LOYALTY.DINARS_PER_POINT.toLocaleString('en-US')} د.ع = نقطة واحدة، وكل {LOYALTY.POINTS_PER_REWARD} نقاط = خصم {formatPrice(LOYALTY.REWARD_VALUE)}.
        </p>
        <Link href="/menu" className="btn-accent mt-4">اطلب واجمع نقاطك</Link>
      </div>
    </div>
  );
}
