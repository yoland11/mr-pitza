'use client';

import { Database, Download, Loader2, Upload, Users } from 'lucide-react';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { downloadCSV, downloadJSON } from '@/lib/export';
import { formatDateTime } from '@/lib/utils';

const FULL_TABLES = [
  'categories', 'products', 'product_sizes', 'product_addons', 'product_images',
  'coupons', 'banners', 'restaurant_settings', 'orders', 'order_items', 'reviews',
  'drivers', 'suppliers', 'inventory_items', 'stock_movements', 'expenses', 'revenues',
];

export default function BackupPage() {
  const [busy, setBusy] = useState<string | null>(null);

  const exportFull = async () => {
    setBusy('full');
    try {
      const supabase = createClient();
      const data: Record<string, unknown[]> = {};
      for (const t of FULL_TABLES) {
        const { data: rows } = await supabase.from(t).select('*');
        data[t] = rows ?? [];
      }
      downloadJSON(`mr-pizza-backup-${Date.now()}.json`, { exported_at: new Date().toISOString(), tables: data });
      toast.success('تم تصدير النسخة الكاملة');
    } finally {
      setBusy(null);
    }
  };

  const exportOrders = async () => {
    setBusy('orders');
    try {
      const supabase = createClient();
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      downloadCSV(`orders-${Date.now()}.csv`, ['الكود', 'الزبون', 'الهاتف', 'المدينة', 'الحالة', 'الدفع', 'الإجمالي', 'التاريخ'],
        (data ?? []).map((o) => [o.code, o.customer_name, o.customer_phone, o.city, o.status, o.payment_status, o.total, formatDateTime(o.created_at)]));
      toast.success('تم تصدير الطلبات');
    } finally {
      setBusy(null);
    }
  };

  const exportCustomers = async () => {
    setBusy('customers');
    try {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      downloadCSV(`customers-${Date.now()}.csv`, ['الاسم', 'الهاتف', 'البريد', 'النقاط', 'تاريخ التسجيل'],
        (data ?? []).map((c) => [c.full_name ?? '', c.phone ?? '', c.email ?? '', c.points ?? 0, formatDateTime(c.created_at)]));
      toast.success('تم تصدير العملاء');
    } finally {
      setBusy(null);
    }
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy('import');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: json.tables ?? json }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر الاستيراد');
        return;
      }
      const count = Object.values(data.imported as Record<string, number>).reduce((s, n) => s + n, 0);
      toast.success(`تم استيراد ${count} سجل`);
    } catch {
      toast.error('ملف غير صالح');
    } finally {
      setBusy(null);
      e.target.value = '';
    }
  };

  return (
    <>
      <AdminPageHeader title="النسخ الاحتياطي" subtitle="تصدير واستيراد بيانات المطعم" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="نسخة كاملة (JSON)" desc="كل الجداول الأساسية في ملف واحد" Icon={Database} loading={busy === 'full'} onClick={exportFull} />
        <Card title="تصدير الطلبات (CSV)" desc="كل الطلبات بصيغة Excel" Icon={Download} loading={busy === 'orders'} onClick={exportOrders} />
        <Card title="تصدير العملاء (CSV)" desc="بيانات العملاء والنقاط" Icon={Users} loading={busy === 'customers'} onClick={exportCustomers} />
      </div>

      <div className="mt-6 card p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink"><Upload className="h-5 w-5 text-brand-red" /> استيراد نسخة احتياطية</h2>
        <p className="mt-1 text-sm text-ink-muted">
          يستورد الجداول الآمنة فقط (الأقسام، المنتجات، الأحجام، الإضافات، الكوبونات، البانرات، الموردون، المخزون).
          لا يتم المساس بالطلبات أو حسابات العملاء. (للمالك/المدير فقط)
        </p>
        <label className="btn-primary mt-4 inline-flex cursor-pointer">
          {busy === 'import' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          اختر ملف JSON
          <input type="file" accept="application/json" onChange={onImport} disabled={busy === 'import'} className="hidden" />
        </label>
      </div>
    </>
  );
}

function Card({ title, desc, Icon, loading, onClick }: { title: string; desc: string; Icon: typeof Database; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} className="card p-5 text-right transition hover:-translate-y-1 hover:shadow-card-hover disabled:opacity-60">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-red/10 text-brand-red">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}</span>
      <p className="mt-3 font-extrabold text-ink">{title}</p>
      <p className="text-sm text-ink-muted">{desc}</p>
    </button>
  );
}
