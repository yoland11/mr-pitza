'use client';

import { AlertTriangle, ArrowDownUp, Download, Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { downloadCSV } from '@/lib/export';
import type { InventoryItem, StockDirection, Supplier } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

type Draft = Partial<InventoryItem>;
const empty: Draft = { name: '', unit: 'وحدة', quantity: 0, min_quantity: 0, cost: 0, supplier_id: null, is_active: true };

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [moveItem, setMoveItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: inv }, { data: sup }] = await Promise.all([
      supabase.from('inventory_items').select('*').order('name'),
      supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
    ]);
    setItems((inv as InventoryItem[]) ?? []);
    setSuppliers((sup as Supplier[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error('اسم الصنف مطلوب');
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: editing.name,
      unit: editing.unit || 'وحدة',
      quantity: Number(editing.quantity) || 0,
      min_quantity: Number(editing.min_quantity) || 0,
      cost: Number(editing.cost) || 0,
      supplier_id: editing.supplier_id || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from('inventory_items').update(payload).eq('id', editing.id)
      : await supabase.from('inventory_items').insert(payload);
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ — تحقّق من صلاحيتك');
    toast.success('تم الحفظ');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا الصنف؟')) return;
    const supabase = createClient();
    await supabase.from('inventory_items').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const lowStock = items.filter((i) => i.quantity <= i.min_quantity);

  const exportCSV = () => {
    downloadCSV(`inventory-${Date.now()}.csv`, ['الصنف', 'الكمية', 'الوحدة', 'الحد الأدنى', 'التكلفة'],
      items.map((i) => [i.name, i.quantity, i.unit, i.min_quantity, i.cost]));
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة المخزون"
        subtitle="الأصناف والكميات وحركات المخزون وتنبيهات النفاد"
        action={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-outline btn-sm"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={() => setEditing(empty)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> صنف جديد</button>
          </div>
        }
      />

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-brand-red/10 p-4 text-sm font-bold text-brand-red">
          <AlertTriangle className="h-5 w-5" /> {lowStock.length} صنف وصل للحد الأدنى أو نفد — يرجى التزويد.
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : items.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-ink-muted"><Package className="h-9 w-9 text-brand-red" /><p className="mt-2 font-bold text-ink">لا توجد أصناف</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => {
            const low = i.quantity <= i.min_quantity;
            return (
              <div key={i.id} className={cn('card p-4', low && 'ring-2 ring-brand-red/40')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-extrabold text-ink">{i.name}</p>
                    <p className="text-xs text-ink-muted">التكلفة: {formatPrice(i.cost)}</p>
                  </div>
                  {low && <span className="badge-red">منخفض</span>}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-black text-ink">{i.quantity}</span>
                    <span className="mr-1 text-sm text-ink-muted">{i.unit}</span>
                  </div>
                  <span className="text-xs text-ink-muted">الحد الأدنى: {i.min_quantity}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setMoveItem(i)} className="btn-primary btn-sm flex-1"><ArrowDownUp className="h-4 w-4" /> حركة</button>
                  <button onClick={() => setEditing(i)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(i.id)} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* تعديل/إضافة صنف */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'تعديل صنف' : 'صنف جديد'}>
        {editing && (
          <div className="space-y-4">
            <div><label className="field-label">الاسم</label><input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="field" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">الكمية الحالية</label><input type="number" value={editing.quantity ?? 0} onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })} className="field" /></div>
              <div><label className="field-label">الوحدة</label><input value={editing.unit ?? ''} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className="field" placeholder="كغم / علبة / حبة" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">الحد الأدنى</label><input type="number" value={editing.min_quantity ?? 0} onChange={(e) => setEditing({ ...editing, min_quantity: Number(e.target.value) })} className="field" /></div>
              <div><label className="field-label">تكلفة الوحدة</label><input type="number" value={editing.cost ?? 0} onChange={(e) => setEditing({ ...editing, cost: Number(e.target.value) })} className="field" /></div>
            </div>
            <div>
              <label className="field-label">المورد (اختياري)</label>
              <select value={editing.supplier_id ?? ''} onChange={(e) => setEditing({ ...editing, supplier_id: e.target.value || null })} className="field">
                <option value="">بدون</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}</button>
          </div>
        )}
      </Modal>

      {/* حركة مخزون */}
      <MoveModal item={moveItem} onClose={() => setMoveItem(null)} onDone={() => { setMoveItem(null); load(); }} />
    </>
  );
}

function MoveModal({ item, onClose, onDone }: { item: InventoryItem | null; onClose: () => void; onDone: () => void }) {
  const [direction, setDirection] = useState<StockDirection>('in');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDirection('in'); setQty(''); setReason(''); }, [item]);
  if (!item) return null;

  const save = async () => {
    const q = Number(qty);
    if (!q || q < 0) return toast.error('أدخل كمية صحيحة');
    setSaving(true);
    const supabase = createClient();
    const newQty = direction === 'in' ? item.quantity + q : direction === 'out' ? item.quantity - q : q;
    const { error } = await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', item.id);
    if (!error) await supabase.from('stock_movements').insert({ item_id: item.id, direction, quantity: q, reason: reason || null });
    setSaving(false);
    if (error) return toast.error('تعذّر الحفظ — تحقّق من صلاحيتك');
    toast.success('تم تسجيل الحركة');
    onDone();
  };

  return (
    <Modal open onClose={onClose} title={`حركة مخزون — ${item.name}`}>
      <div className="space-y-4">
        <div>
          <label className="field-label">نوع الحركة</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as StockDirection)} className="field">
            <option value="in">إضافة للمخزون (+)</option>
            <option value="out">سحب من المخزون (−)</option>
            <option value="adjust">تعديل الكمية إلى قيمة</option>
          </select>
        </div>
        <div><label className="field-label">{direction === 'adjust' ? 'الكمية الجديدة' : 'الكمية'}</label><input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="field" /></div>
        <div><label className="field-label">السبب (اختياري)</label><input value={reason} onChange={(e) => setReason(e.target.value)} className="field" /></div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ الحركة'}</button>
      </div>
    </Modal>
  );
}
