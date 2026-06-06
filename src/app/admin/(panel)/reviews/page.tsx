'use client';

import { Eye, EyeOff, Loader2, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { Review } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

interface ReviewRow extends Review {
  order?: { code: string } | null;
}

export default function AdminReviews() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('reviews')
      .select('*, order:orders(code)')
      .order('created_at', { ascending: false });
    setItems((data as ReviewRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const toggleApprove = async (r: ReviewRow) => {
    const supabase = createClient();
    const { error } = await supabase.from('reviews').update({ is_approved: !r.is_approved }).eq('id', r.id);
    if (error) return toast.error('تعذّر التحديث');
    setItems((p) => p.map((x) => (x.id === r.id ? { ...x, is_approved: !x.is_approved } : x)));
    toast.success(!r.is_approved ? 'تم اعتماد التقييم' : 'تم إخفاء التقييم');
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا التقييم؟')) return;
    const supabase = createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) return toast.error('تعذّر الحذف');
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  const filtered = items.filter((r) =>
    filter === 'all' ? true : filter === 'approved' ? r.is_approved : !r.is_approved,
  );

  return (
    <>
      <AdminPageHeader title="تقييمات العملاء" subtitle="اعتمد أو أخفِ تقييمات الزبائن قبل ظهورها في الموقع" />

      <div className="mb-4 flex gap-2">
        {([
          { k: 'all', l: 'الكل' },
          { k: 'pending', l: 'بانتظار الاعتماد' },
          { k: 'approved', l: 'المعتمدة' },
        ] as const).map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn('rounded-full px-4 py-2 text-sm font-bold transition', filter === k ? 'bg-brand-red text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-ink/5')}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : filtered.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <span className="text-4xl">⭐</span>
          <p className="mt-2 font-bold">لا توجد تقييمات</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold text-ink">{r.customer_name || 'زبون'}</p>
                  <p className="text-xs text-ink-muted">{r.order?.code ? `طلب ${r.order.code} · ` : ''}{formatDateTime(r.created_at)}</p>
                </div>
                <span className={cn('badge', r.is_approved ? 'badge-yellow' : 'badge-soft')}>
                  {r.is_approved ? 'معتمد' : 'بانتظار'}
                </span>
              </div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('h-4 w-4', i < r.rating ? 'fill-brand-yellow text-brand-yellow' : 'text-line')} />
                ))}
              </div>
              {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink/90">{r.comment}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => toggleApprove(r)} className="btn-outline btn-sm flex-1">
                  {r.is_approved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {r.is_approved ? 'إخفاء' : 'اعتماد'}
                </button>
                <button onClick={() => remove(r.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
