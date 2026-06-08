'use client';

import { Gift, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { LOYALTY, type PointTransaction } from '@/lib/types';
import { formatDateTime, formatPrice } from '@/lib/utils';

export default function PointsPage() {
  const [points, setPoints] = useState(0);
  const [ledger, setLedger] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: profile }, { data: tx }] = await Promise.all([
      supabase.from('profiles').select('points').eq('id', user.id).single(),
      supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setPoints(profile?.points ?? 0);
    setLedger((tx as PointTransaction[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const redeem = async () => {
    setRedeeming(true);
    try {
      const res = await fetch('/api/loyalty/redeem', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر الاستبدال');
        return;
      }
      toast.success(`تم إنشاء كوبون ${data.code} بقيمة ${formatPrice(data.value)} 🎉`);
      load();
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>;

  const rewards = Math.floor(points / LOYALTY.POINTS_PER_REWARD);
  const canRedeem = rewards >= 1;

  return (
    <div className="space-y-5">
      {/* الرصيد */}
      <div className="card bg-brand-gradient p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-white/85"><Sparkles className="h-5 w-5 text-brand-yellow" /> رصيد نقاطك</p>
            <p className="mt-1 text-4xl font-black">{points} <span className="text-lg font-bold">نقطة</span></p>
            <p className="mt-1 text-sm text-white/80">
              {canRedeem ? `يمكنك استبدال خصم بقيمة ${formatPrice(rewards * LOYALTY.REWARD_VALUE)}` : `كل ${LOYALTY.POINTS_PER_REWARD} نقاط = خصم ${formatPrice(LOYALTY.REWARD_VALUE)}`}
            </p>
          </div>
          <Gift className="h-12 w-12 text-brand-yellow" />
        </div>
        <button onClick={redeem} disabled={!canRedeem || redeeming} className="btn-accent mt-4">
          {redeeming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gift className="h-5 w-5" />}
          استبدال {LOYALTY.POINTS_PER_REWARD} نقاط بخصم {formatPrice(LOYALTY.REWARD_VALUE)}
        </button>
      </div>

      {/* السجل */}
      <div className="card p-5">
        <h2 className="mb-3 text-lg font-extrabold text-ink">سجل النقاط</h2>
        {ledger.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">لا توجد حركات بعد — اطلب لتجمع نقاطك!</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {ledger.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-bold text-ink">{t.reason ?? 'حركة نقاط'}</p>
                  <p className="text-xs text-ink-muted">{formatDateTime(t.created_at)}</p>
                </div>
                <span className={`font-black ${t.delta >= 0 ? 'text-green-600' : 'text-brand-red'}`}>
                  {t.delta >= 0 ? '+' : ''}{t.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
