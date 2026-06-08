'use client';

import {
  Coins,
  Download,
  Loader2,
  Plus,
  Printer,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { downloadCSV } from '@/lib/export';
import type { CashboxTransaction, Debt, Expense, Revenue } from '@/lib/types';
import { cn, formatDate, formatPrice } from '@/lib/utils';

type Tab = 'overview' | 'expenses' | 'revenues' | 'cashbox' | 'debts';
type Period = 'day' | 'week' | 'month' | 'year';
const PERIODS: { k: Period; l: string }[] = [
  { k: 'day', l: 'اليوم' },
  { k: 'week', l: 'الأسبوع' },
  { k: 'month', l: 'الشهر' },
  { k: 'year', l: 'السنة' },
];

function periodStart(p: Period): Date {
  const d = new Date();
  if (p === 'day') d.setHours(0, 0, 0, 0);
  else if (p === 'week') d.setTime(d.getTime() - 7 * 86400000);
  else if (p === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  else if (p === 'year') return new Date(d.getFullYear(), 0, 1);
  return d;
}

export default function AccountingPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [cashbox, setCashbox] = useState<CashboxTransaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modal, setModal] = useState<Tab | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const start = periodStart(period).toISOString();
    const [{ data: ord }, { data: exp }, { data: rev }, { data: cash }, { data: dbt }] = await Promise.all([
      supabase.from('orders').select('total, status, created_at').gte('created_at', start),
      supabase.from('expenses').select('*').gte('spent_at', start.slice(0, 10)).order('spent_at', { ascending: false }),
      supabase.from('revenues').select('*').gte('received_at', start.slice(0, 10)).order('received_at', { ascending: false }),
      supabase.from('cashbox_transactions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('debts').select('*').order('created_at', { ascending: false }),
    ]);
    setSales((ord ?? []).filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0));
    setExpenses((exp as Expense[]) ?? []);
    setRevenues((rev as Revenue[]) ?? []);
    setCashbox((cash as CashboxTransaction[]) ?? []);
    setDebts((dbt as Debt[]) ?? []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const manualRevenue = revenues.reduce((s, r) => s + Number(r.amount), 0);
  const totalRevenue = sales + manualRevenue;
  const profit = totalRevenue - totalExpenses;
  const cashBalance = cashbox.reduce((s, c) => s + (c.direction === 'in' ? Number(c.amount) : -Number(c.amount)), 0);
  const receivables = debts.filter((d) => d.kind === 'receivable' && !d.is_settled).reduce((s, d) => s + Number(d.amount), 0);
  const payables = debts.filter((d) => d.kind === 'payable' && !d.is_settled).reduce((s, d) => s + Number(d.amount), 0);

  const del = async (table: string, id: string, setter: () => void) => {
    if (!confirm('حذف هذا السجل؟')) return;
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return toast.error('تعذّر الحذف — تحقّق من صلاحيتك');
    setter();
    toast.success('تم الحذف');
  };

  const exportStatement = () => {
    downloadCSV(
      `accounting-${period}-${Date.now()}.csv`,
      ['البند', 'القيمة (د.ع)'],
      [
        ['مبيعات الطلبات', Math.round(sales)],
        ['إيرادات أخرى', Math.round(manualRevenue)],
        ['إجمالي الإيرادات', Math.round(totalRevenue)],
        ['إجمالي المصروفات', Math.round(totalExpenses)],
        ['صافي الربح', Math.round(profit)],
        ['رصيد الصندوق', Math.round(cashBalance)],
        ['ذمم لنا', Math.round(receivables)],
        ['ذمم علينا', Math.round(payables)],
      ],
    );
  };

  const cards = [
    { label: 'إجمالي الإيرادات', value: formatPrice(totalRevenue), Icon: TrendingUp, color: 'bg-green-600' },
    { label: 'إجمالي المصروفات', value: formatPrice(totalExpenses), Icon: TrendingDown, color: 'bg-rose-600' },
    { label: 'صافي الربح', value: formatPrice(profit), Icon: Coins, color: profit >= 0 ? 'bg-brand-red' : 'bg-ink' },
    { label: 'رصيد الصندوق', value: formatPrice(cashBalance), Icon: Wallet, color: 'bg-blue-600' },
  ];

  return (
    <>
      <AdminPageHeader
        title="المحاسبة"
        subtitle="الإيرادات والمصروفات والأرباح والصندوق والديون"
        action={
          <div className="no-print flex gap-2">
            <button onClick={exportStatement} className="btn-outline btn-sm"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={() => window.print()} className="btn-outline btn-sm"><Printer className="h-4 w-4" /> PDF</button>
          </div>
        }
      />

      {/* الفترة */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button key={p.k} onClick={() => setPeriod(p.k)} className={cn('rounded-full px-4 py-2 text-sm font-bold transition', period === p.k ? 'bg-brand-red text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-ink/5')}>{p.l}</button>
        ))}
      </div>

      {/* البطاقات */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 p-5">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${color}`}><Icon className="h-6 w-6" /></span>
            <div className="min-w-0"><p className="text-xs text-ink-muted">{label}</p><p className="truncate text-lg font-black text-ink">{value}</p></div>
          </div>
        ))}
      </div>

      {/* التبويبات */}
      <div className="no-scrollbar no-print my-5 flex gap-2 overflow-x-auto">
        {([['overview', 'كشف الحساب'], ['expenses', 'المصروفات'], ['revenues', 'الإيرادات'], ['cashbox', 'الصندوق'], ['debts', 'الديون']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition', tab === k ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-ink/5')}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="print-area card p-6">
              <h2 className="mb-4 text-lg font-extrabold text-ink">كشف الحساب — {PERIODS.find((p) => p.k === period)?.l}</h2>
              <dl className="space-y-2 text-sm">
                <Row label="مبيعات الطلبات" value={formatPrice(sales)} />
                <Row label="إيرادات أخرى" value={formatPrice(manualRevenue)} />
                <Row label="إجمالي الإيرادات" value={formatPrice(totalRevenue)} strong />
                <Row label="إجمالي المصروفات" value={`- ${formatPrice(totalExpenses)}`} />
                <div className="flex justify-between border-t border-line pt-3 text-base">
                  <span className="font-extrabold text-ink">صافي الربح</span>
                  <span className={cn('font-black', profit >= 0 ? 'text-green-600' : 'text-brand-red')}>{formatPrice(profit)}</span>
                </div>
                <Row label="رصيد الصندوق" value={formatPrice(cashBalance)} />
                <Row label="ذمم مدينة (لنا)" value={formatPrice(receivables)} />
                <Row label="ذمم دائنة (علينا)" value={formatPrice(payables)} />
              </dl>
            </div>
          )}

          {tab === 'expenses' && (
            <ListSection title="المصروفات" onAdd={() => setModal('expenses')}>
              {expenses.map((e) => (
                <RowItem key={e.id} title={`${e.category} — ${e.description ?? ''}`} sub={`${formatDate(e.spent_at)}${e.vendor ? ` · ${e.vendor}` : ''}`} amount={`- ${formatPrice(e.amount)}`} amountClass="text-rose-600" onDelete={() => del('expenses', e.id, () => setExpenses((p) => p.filter((x) => x.id !== e.id)))} />
              ))}
            </ListSection>
          )}

          {tab === 'revenues' && (
            <ListSection title="إيرادات إضافية" onAdd={() => setModal('revenues')}>
              {revenues.map((r) => (
                <RowItem key={r.id} title={`${r.source} — ${r.description ?? ''}`} sub={formatDate(r.received_at)} amount={`+ ${formatPrice(r.amount)}`} amountClass="text-green-600" onDelete={() => del('revenues', r.id, () => setRevenues((p) => p.filter((x) => x.id !== r.id)))} />
              ))}
            </ListSection>
          )}

          {tab === 'cashbox' && (
            <ListSection title={`الصندوق — الرصيد: ${formatPrice(cashBalance)}`} onAdd={() => setModal('cashbox')}>
              {cashbox.map((c) => (
                <RowItem key={c.id} title={c.reason ?? (c.direction === 'in' ? 'إيداع' : 'سحب')} sub={formatDate(c.created_at)} amount={`${c.direction === 'in' ? '+' : '-'} ${formatPrice(c.amount)}`} amountClass={c.direction === 'in' ? 'text-green-600' : 'text-rose-600'} onDelete={() => del('cashbox_transactions', c.id, () => setCashbox((p) => p.filter((x) => x.id !== c.id)))} />
              ))}
            </ListSection>
          )}

          {tab === 'debts' && (
            <ListSection title="الديون والذمم" onAdd={() => setModal('debts')}>
              {debts.map((d) => (
                <RowItem key={d.id} title={`${d.party} — ${d.kind === 'receivable' ? 'لنا' : 'علينا'}`} sub={`${d.description ?? ''}${d.due_date ? ` · استحقاق ${formatDate(d.due_date)}` : ''}${d.is_settled ? ' · مسدّد' : ''}`} amount={formatPrice(d.amount)} amountClass={d.kind === 'receivable' ? 'text-green-600' : 'text-rose-600'} onDelete={() => del('debts', d.id, () => setDebts((p) => p.filter((x) => x.id !== d.id)))} />
              ))}
            </ListSection>
          )}
        </>
      )}

      <AddModal kind={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between"><dt className="text-ink-muted">{label}</dt><dd className={cn('tabular-nums', strong ? 'font-extrabold text-ink' : 'font-bold text-ink')}>{value}</dd></div>;
}

function ListSection({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        <button onClick={onAdd} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> إضافة</button>
      </div>
      {items.length === 0 ? <p className="py-8 text-center text-sm text-ink-muted">لا توجد سجلات</p> : <ul className="divide-y divide-line">{children}</ul>}
    </div>
  );
}

function RowItem({ title, sub, amount, amountClass, onDelete }: { title: string; sub: string; amount: string; amountClass: string; onDelete: () => void }) {
  return (
    <li className="flex items-center justify-between gap-2 py-3">
      <div className="min-w-0"><p className="truncate font-bold text-ink">{title}</p><p className="truncate text-xs text-ink-muted">{sub}</p></div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn('font-black tabular-nums', amountClass)}>{amount}</span>
        <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
}

function AddModal({ kind, onClose, onSaved }: { kind: Tab | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({}); }, [kind]);
  if (!kind || kind === 'overview') return null;

  const save = async () => {
    const supabase = createClient();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error('أدخل مبلغاً صحيحاً');
    setSaving(true);
    let res;
    if (kind === 'expenses') res = await supabase.from('expenses').insert({ category: form.category || 'عام', description: form.description || null, amount, vendor: form.vendor || null, spent_at: form.date || undefined });
    else if (kind === 'revenues') res = await supabase.from('revenues').insert({ source: form.source || 'أخرى', description: form.description || null, amount, received_at: form.date || undefined });
    else if (kind === 'cashbox') res = await supabase.from('cashbox_transactions').insert({ direction: (form.direction as 'in' | 'out') || 'in', amount, reason: form.reason || null });
    else res = await supabase.from('debts').insert({ party: form.party || 'جهة', kind: (form.kind as 'receivable' | 'payable') || 'receivable', amount, description: form.description || null, due_date: form.due_date || null });
    setSaving(false);
    if (res?.error) return toast.error('تعذّر الحفظ — تحقّق من صلاحيتك (مالك/مدير)');
    toast.success('تم الحفظ');
    onSaved();
  };

  const titles: Record<string, string> = { expenses: 'مصروف جديد', revenues: 'إيراد جديد', cashbox: 'حركة صندوق', debts: 'دين / ذمة' };

  return (
    <Modal open onClose={onClose} title={titles[kind]}>
      <div className="space-y-4">
        {kind === 'expenses' && (
          <>
            <Field label="الفئة"><input className="field" onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="رواتب / إيجار / مواد / كهرباء" /></Field>
            <Field label="الوصف"><input className="field" onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="المورد/الجهة"><input className="field" onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
            <Field label="التاريخ"><input type="date" className="field" onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </>
        )}
        {kind === 'revenues' && (
          <>
            <Field label="المصدر"><input className="field" onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="بيع / استثمار / أخرى" /></Field>
            <Field label="الوصف"><input className="field" onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="التاريخ"><input type="date" className="field" onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </>
        )}
        {kind === 'cashbox' && (
          <Field label="النوع">
            <select className="field" onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              <option value="in">إيداع (إدخال)</option>
              <option value="out">سحب (إخراج)</option>
            </select>
            <input className="field mt-2" onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="السبب" />
          </Field>
        )}
        {kind === 'debts' && (
          <>
            <Field label="الجهة"><input className="field" onChange={(e) => setForm({ ...form, party: e.target.value })} /></Field>
            <Field label="النوع">
              <select className="field" onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="receivable">لنا (ذمة مدينة)</option>
                <option value="payable">علينا (ذمة دائنة)</option>
              </select>
            </Field>
            <Field label="الوصف"><input className="field" onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="تاريخ الاستحقاق"><input type="date" className="field" onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
          </>
        )}
        <Field label="المبلغ (د.ع)"><input type="number" className="field" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="field-label">{label}</label>{children}</div>;
}
