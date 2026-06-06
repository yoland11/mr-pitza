'use client';

import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import type { RestaurantSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
  const [s, setS] = useState<RestaurantSettings | null>(null);
  const [zones, setZones] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('restaurant_settings').select('*').limit(1).single();
      if (data) {
        setS(data as RestaurantSettings);
        setZones((data.delivery_zones ?? []).join('، '));
      }
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const supabase = createClient();
    const delivery_zones = zones.split(/[،,]/).map((z) => z.trim()).filter(Boolean);
    const { error } = await supabase
      .from('restaurant_settings')
      .update({
        name: s.name,
        phone: s.phone,
        whatsapp: s.whatsapp,
        address: s.address,
        city: s.city,
        delivery_zones,
        working_hours: s.working_hours,
        delivery_fee: Number(s.delivery_fee) || 0,
        min_order: Number(s.min_order) || 0,
        is_open: s.is_open,
        closed_message: s.closed_message,
        map_url: s.map_url,
        qr_payment_image_url: s.qr_payment_image_url,
        sound_alerts: s.sound_alerts,
        latitude: s.latitude,
        longitude: s.longitude,
        facebook_url: s.facebook_url,
        instagram_url: s.instagram_url,
        tiktok_url: s.tiktok_url,
      })
      .eq('id', s.id);
    setSaving(false);
    if (error) return toast.error('تعذّر حفظ الإعدادات');
    toast.success('تم حفظ الإعدادات');
  };

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>;
  if (!s) return <p className="text-ink-muted">لا توجد إعدادات. نفّذ ملف schema.sql أولاً.</p>;

  return (
    <>
      <AdminPageHeader
        title="إعدادات المطعم"
        subtitle="تحكّم ببيانات المطعم والتوصيل والتواصل"
        action={<button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* بيانات أساسية */}
        <section className="card space-y-4 p-5">
          <h2 className="text-lg font-extrabold text-ink">بيانات المطعم</h2>
          <Field label="اسم المطعم"><input value={s.name} onChange={(e) => set('name', e.target.value)} className="field" /></Field>
          <Field label="رقم الهاتف"><input value={s.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" className="field text-right" /></Field>
          <Field label="واتساب (دولي بدون +)"><input value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} dir="ltr" className="field text-right" placeholder="9647700000000" /></Field>
          <Field label="المدينة / القضاء"><input value={s.city} onChange={(e) => set('city', e.target.value)} className="field" /></Field>
          <Field label="العنوان"><input value={s.address} onChange={(e) => set('address', e.target.value)} className="field" /></Field>
          <Field label="أوقات العمل"><input value={s.working_hours} onChange={(e) => set('working_hours', e.target.value)} className="field" /></Field>
          <Field label="رابط الخريطة (اختياري)"><input value={s.map_url ?? ''} onChange={(e) => set('map_url', e.target.value)} dir="ltr" className="field text-right" placeholder="https://maps.google.com/..." /></Field>
        </section>

        {/* التوصيل والحالة */}
        <section className="card space-y-4 p-5">
          <h2 className="text-lg font-extrabold text-ink">التوصيل والحالة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رسوم التوصيل"><input type="number" value={s.delivery_fee} onChange={(e) => set('delivery_fee', Number(e.target.value))} className="field" /></Field>
            <Field label="الحد الأدنى للطلب"><input type="number" value={s.min_order} onChange={(e) => set('min_order', Number(e.target.value))} className="field" /></Field>
          </div>
          <Field label="مناطق التوصيل داخل المدينة / القضاء (افصل بفاصلة)">
            <textarea value={zones} onChange={(e) => setZones(e.target.value)} rows={2} className="field resize-none" placeholder="الكرادة، المنصور، زيونة" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="خط العرض (latitude)"><input type="number" value={s.latitude ?? ''} onChange={(e) => set('latitude', e.target.value ? Number(e.target.value) : null)} dir="ltr" className="field text-right" /></Field>
            <Field label="خط الطول (longitude)"><input type="number" value={s.longitude ?? ''} onChange={(e) => set('longitude', e.target.value ? Number(e.target.value) : null)} dir="ltr" className="field text-right" /></Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-cream px-4 py-3">
            <span className="font-bold text-ink">حالة المطعم</span>
            <span className="flex items-center gap-2">
              <span className={cn('badge', s.is_open ? 'badge-yellow' : 'badge-red')}>{s.is_open ? 'مفتوح' : 'مغلق'}</span>
              <input type="checkbox" checked={s.is_open} onChange={(e) => set('is_open', e.target.checked)} className="h-6 w-6 accent-brand-red" />
            </span>
          </label>
          <Field label="رسالة الإغلاق (تظهر للزبون عند إغلاق المطعم)">
            <textarea value={s.closed_message ?? ''} onChange={(e) => set('closed_message', e.target.value)} rows={2} className="field resize-none" placeholder="عذراً، المطعم مغلق حالياً. نعود قريباً!" />
          </Field>
          <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-cream px-4 py-3">
            <span className="font-bold text-ink">صوت الطلبات الجديدة (لوحة الإدارة)</span>
            <span className="flex items-center gap-2">
              <span className={cn('badge', s.sound_alerts ? 'badge-yellow' : 'badge-soft')}>{s.sound_alerts ? 'مفعّل' : 'متوقف'}</span>
              <input type="checkbox" checked={s.sound_alerts} onChange={(e) => set('sound_alerts', e.target.checked)} className="h-6 w-6 accent-brand-red" />
            </span>
          </label>
        </section>

        {/* صورة QR للدفع بالبطاقة */}
        <section className="card space-y-4 p-5 lg:col-span-2">
          <h2 className="text-lg font-extrabold text-ink">صورة QR للدفع بالبطاقة / ماستر كارد</h2>
          <p className="text-sm text-ink-muted">تظهر هذه الصورة للزبون في صفحة الدفع عند اختيار «بطاقة / ماستر كارد».</p>
          <div className="max-w-sm">
            <ImageUpload value={s.qr_payment_image_url ?? null} onChange={(url) => set('qr_payment_image_url', url)} folder="payment" />
          </div>
        </section>

        {/* روابط التواصل */}
        <section className="card space-y-4 p-5 lg:col-span-2">
          <h2 className="text-lg font-extrabold text-ink">روابط التواصل</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="فيسبوك"><input value={s.facebook_url ?? ''} onChange={(e) => set('facebook_url', e.target.value)} dir="ltr" className="field text-right" /></Field>
            <Field label="انستغرام"><input value={s.instagram_url ?? ''} onChange={(e) => set('instagram_url', e.target.value)} dir="ltr" className="field text-right" /></Field>
            <Field label="تيك توك"><input value={s.tiktok_url ?? ''} onChange={(e) => set('tiktok_url', e.target.value)} dir="ltr" className="field text-right" /></Field>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <button onClick={save} disabled={saving} className="btn-primary w-full sm:w-auto">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} حفظ كل التغييرات</button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
