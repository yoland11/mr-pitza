'use client';

import { Loader2, Pencil, Phone, Plus, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import {
  PURCHASE_STATUS_LABELS,
  type InventoryItem,
  type PurchaseOrder,
  type PurchaseStatus,
  type Supplier,
} from '@/lib/types';
import { cn, formatDate, formatPrice } from '@/lib/utils';

type Tab = 'suppliers' | 'purchases';
interface POItemDraft { item_id: string | null; name: string; quantity: number; unit_cost: number }

export default function SuppliersPage() {
  const [tab, setTab] = useState<Tab>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [supDraft, setSupDraft] = useState<Partial<Supplier> | null>(null);
  const [poOpen, setPoOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: sup }, { data: inv }, { data: p }] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('inventory_items').select('*').order('name'),
      supabase.from('purchase_orders').select('*, items:purchase_order_items(*)').order('created_at', { ascending: false }),
    ]);
    setSuppliers((sup as Supplier[]) ?? []);
    setItems((inv as InventoryItem[]) ?? []);
    setPos((p as PurchaseOrder[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const saveSupplier = async () => {
    if (!supDraft?.name?.trim()) return toast.error('اسم المورد مطلوب');
    setSaving(true);
    const supabase = createClient();
    const payload = { name: supDraft.name, phone: supDraft.phone || null, contact_name: supDraft.contact_name || null, notes: supDraft.notes || null, is_active: supDraft.is_active ?? true };
    const { error } = supDraft.id ? await supabase.from('suppliers').update(payload).eq('id', supDraft.id) : await supabase.from('suppliers').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ — تحقّق من صلاحيتك');
    toast.success('تم الحفظ');
    setSupDraft(null);
    load();
  };

  const removeSupplier = async (id: string) => {
    if (!confirm('حذف المورد؟')) return;
    const supabase = createClient();
    await supabase.from('suppliers').delete().eq('id', id);
    setSuppliers((p) => p.filter((x) => x.id !== id));
  };

  const changePOStatus = async (po: PurchaseOrder, status: PurchaseStatus) => {
    const supabase = createClient();
    const patch: Record<string, unknown> = { status };
    if (status === 'received') patch.received_at = new Date().toISOString();
    const { error } = await supabase.from('purchase_orders').update(patch).eq('id', po.id);
    if (error) return toast.error('تعذّر التحديث');
    // عند الاستلام: إضافة الكميات للمخزون
    if (status === 'received' && po.status !== 'received') {
      for (const it of po.items ?? []) {
        if (it.item_id) {
          const target = items.find((x) => x.id === it.item_id);
          if (target) {
            await supabase.from('inventory_items').update({ quantity: Number(target.quantity) + Number(it.quantity) }).eq('id', it.item_id);
            await supabase.from('stock_movements').insert({ item_id: it.item_id, direction: 'in', quantity: it.quantity, reason: 'استلام أمر شراء' });
          }
        }
      }
      toast.success('تم استلام البضاعة وتحديث المخزون');
    }
    load();
  };

  const removePO = async (id: string) => {
    if (!confirm('حذف أمر الشراء؟')) return;
    const supabase = createClient();
    await supabase.from('purchase_orders').delete().eq('id', id);
    setPos((p) => p.filter((x) => x.id !== id));
  };

  return (
    <>
      <AdminPageHeader title="الموردون والمشتريات" subtitle="إدارة الموردين وأوامر الشراء واستلام المواد" />

      <div className="mb-4 flex gap-2">
        {([['suppliers', 'الموردون'], ['purchases', 'أوامر الشراء']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('rounded-full px-4 py-2 text-sm font-bold transition', tab === k ? 'bg-brand-red text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-ink/5')}>{l}</button>
        ))}
        <div className="flex-1" />
        {tab === 'suppliers'
          ? <button onClick={() => setSupDraft({ name: '', is_active: true })} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> مورد</button>
          : <button onClick={() => setPoOpen(true)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> أمر شراء</button>}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : tab === 'suppliers' ? (
        suppliers.length === 0 ? (
          <div className="card grid place-items-center py-16 text-center text-ink-muted"><Truck className="h-9 w-9 text-brand-red" /><p className="mt-2 font-bold text-ink">لا يوجد موردون</p></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-extrabold text-ink">{s.name}</p>{s.phone && <p className="flex items-center gap-1 text-xs text-ink-muted" dir="ltr"><Phone className="h-3 w-3" /> {s.phone}</p>}</div>
                  {!s.is_active && <span className="badge-soft">معطّل</span>}
                </div>
                {s.contact_name && <p className="mt-1 text-xs text-ink-muted">المسؤول: {s.contact_name}</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setSupDraft(s)} className="btn-outline btn-sm flex-1"><Pencil className="h-4 w-4" /> تعديل</button>
                  <button onClick={() => removeSupplier(s.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        pos.length === 0 ? (
          <div className="card grid place-items-center py-16 text-center text-ink-muted"><p className="font-bold text-ink">لا توجد أوامر شراء</p></div>
        ) : (
          <div className="space-y-3">
            {pos.map((po) => (
              <div key={po.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-ink">{suppliers.find((s) => s.id === po.supplier_id)?.name ?? 'مورد'} — {formatPrice(po.total)}</p>
                    <p className="text-xs text-ink-muted">{formatDate(po.created_at)} · {po.items?.length ?? 0} صنف</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={po.status} onChange={(e) => changePOStatus(po, e.target.value as PurchaseStatus)} className="rounded-xl border-2 border-line bg-white px-3 py-1.5 text-sm font-bold focus:border-brand-red focus:outline-none">
                      {(Object.keys(PURCHASE_STATUS_LABELS) as PurchaseStatus[]).map((s) => <option key={s} value={s}>{PURCHASE_STATUS_LABELS[s]}</option>)}
                    </select>
                    <button onClick={() => removePO(po.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <ul className="mt-2 border-t border-line pt-2 text-sm text-ink">
                  {po.items?.map((it) => (
                    <li key={it.id} className="flex justify-between"><span>{it.name} × {it.quantity}</span><span className="font-bold">{formatPrice(it.line_total)}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      )}

      {/* مورد */}
      <Modal open={!!supDraft} onClose={() => setSupDraft(null)} title={supDraft?.id ? 'تعديل مورد' : 'مورد جديد'}>
        {supDraft && (
          <div className="space-y-4">
            <div><label className="field-label">الاسم</label><input value={supDraft.name ?? ''} onChange={(e) => setSupDraft({ ...supDraft, name: e.target.value })} className="field" /></div>
            <div><label className="field-label">الهاتف</label><input value={supDraft.phone ?? ''} onChange={(e) => setSupDraft({ ...supDraft, phone: e.target.value })} dir="ltr" className="field text-right" /></div>
            <div><label className="field-label">اسم المسؤول</label><input value={supDraft.contact_name ?? ''} onChange={(e) => setSupDraft({ ...supDraft, contact_name: e.target.value })} className="field" /></div>
            <div><label className="field-label">ملاحظات</label><input value={supDraft.notes ?? ''} onChange={(e) => setSupDraft({ ...supDraft, notes: e.target.value })} className="field" /></div>
            <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={supDraft.is_active ?? true} onChange={(e) => setSupDraft({ ...supDraft, is_active: e.target.checked })} className="h-5 w-5 accent-brand-red" /><span className="font-bold text-ink">مفعّل</span></label>
            <button onClick={saveSupplier} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
          </div>
        )}
      </Modal>

      {/* أمر شراء */}
      {poOpen && <POModal suppliers={suppliers} items={items} onClose={() => setPoOpen(false)} onDone={() => { setPoOpen(false); load(); }} />}
    </>
  );
}

function POModal({ suppliers, items, onClose, onDone }: { suppliers: Supplier[]; items: InventoryItem[]; onClose: () => void; onDone: () => void }) {
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<POItemDraft[]>([{ item_id: null, name: '', quantity: 1, unit_cost: 0 }]);
  const [saving, setSaving] = useState(false);

  const total = rows.reduce((s, r) => s + Number(r.quantity) * Number(r.unit_cost), 0);

  const save = async () => {
    const valid = rows.filter((r) => r.name.trim() && Number(r.quantity) > 0);
    if (valid.length === 0) return toast.error('أضف صنفاً واحداً على الأقل');
    setSaving(true);
    const supabase = createClient();
    const { data: po, error } = await supabase.from('purchase_orders').insert({ supplier_id: supplierId || null, status: 'ordered', total, notes: notes || null }).select('id').single();
    if (error || !po) { setSaving(false); return toast.error('تعذّر الحفظ — تحقّق من صلاحيتك'); }
    await supabase.from('purchase_order_items').insert(valid.map((r) => ({ po_id: po.id, item_id: r.item_id || null, name: r.name, quantity: Number(r.quantity), unit_cost: Number(r.unit_cost), line_total: Number(r.quantity) * Number(r.unit_cost) })));
    setSaving(false);
    toast.success('تم إنشاء أمر الشراء');
    onDone();
  };

  return (
    <Modal open onClose={onClose} title="أمر شراء جديد">
      <div className="space-y-4">
        <div>
          <label className="field-label">المورد</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="field">
            <option value="">بدون مورد</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="rounded-2xl border border-line p-3">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-extrabold text-ink">الأصناف</span>
            <button type="button" onClick={() => setRows([...rows, { item_id: null, name: '', quantity: 1, unit_cost: 0 }])} className="btn-outline btn-sm"><Plus className="h-4 w-4" /> صنف</button>
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={r.item_id ?? ''} onChange={(e) => { const id = e.target.value || null; const it = items.find((x) => x.id === id); setRows(rows.map((x, xi) => xi === i ? { ...x, item_id: id, name: it?.name ?? x.name, unit_cost: it?.cost ?? x.unit_cost } : x)); }} className="field w-32 py-2">
                  <option value="">يدوي</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <input value={r.name} onChange={(e) => setRows(rows.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} className="field py-2" placeholder="الاسم" />
                <input type="number" value={r.quantity} onChange={(e) => setRows(rows.map((x, xi) => xi === i ? { ...x, quantity: Number(e.target.value) } : x))} className="field w-20 py-2" placeholder="كمية" />
                <input type="number" value={r.unit_cost} onChange={(e) => setRows(rows.map((x, xi) => xi === i ? { ...x, unit_cost: Number(e.target.value) } : x))} className="field w-24 py-2" placeholder="السعر" />
                <button type="button" onClick={() => setRows(rows.filter((_, xi) => xi !== i))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 hover:bg-brand-red hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-left text-sm font-extrabold text-ink">الإجمالي: <span className="text-brand-red">{formatPrice(total)}</span></p>
        </div>
        <div><label className="field-label">ملاحظات</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="field" /></div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ أمر الشراء'}</button>
      </div>
    </Modal>
  );
}
