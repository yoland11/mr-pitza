'use client';

import { Loader2, Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Modal } from '@/components/admin/Modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast';
import { ROLE_LABELS, type StaffUser, type UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROLES: UserRole[] = ['owner', 'manager', 'admin', 'cashier', 'kitchen', 'driver', 'employee'];

export default function AdminStaff() {
  const [items, setItems] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<UserRole | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'employee' as UserRole });

  const canManage = myRole === 'owner' || myRole === 'manager';

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: rows }, { data: me }] = await Promise.all([
      supabase.from('users').select('*').order('created_at'),
      user ? supabase.from('users').select('role').eq('id', user.id).single() : Promise.resolve({ data: null }),
    ]);
    setItems((rows as StaffUser[]) ?? []);
    setMyRole((me?.role as UserRole) ?? null);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id: string, role: UserRole) => {
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ role }).eq('id', id);
    if (error) return toast.error('تعذّر التحديث — هذه الصلاحية للمالك/المدير فقط');
    setItems((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success('تم تحديث الصلاحية');
  };

  const remove = async (id: string) => {
    if (!confirm('إزالة صلاحيات هذا الموظف؟')) return;
    const supabase = createClient();
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return toast.error('تعذّر الحذف');
    setItems((p) => p.filter((u) => u.id !== id));
    toast.success('تمت الإزالة');
  };

  const createStaff = async () => {
    if (!form.email.trim() || form.password.length < 6) return toast.error('أدخل بريداً وكلمة مرور (6 أحرف+)');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'تعذّر إنشاء الحساب');
        return;
      }
      toast.success('تم إنشاء حساب الموظف');
      setOpen(false);
      setForm({ email: '', password: '', full_name: '', role: 'employee' });
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="الموظفون والصلاحيات"
        subtitle="أنشئ حسابات الطاقم وحدّد دور كل موظف"
        action={canManage ? <button onClick={() => setOpen(true)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> موظف جديد</button> : undefined}
      />

      {!canManage && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-brand-yellow/15 p-4 text-sm font-bold text-brand-yellow-dark">
          <ShieldCheck className="h-5 w-5" /> إدارة الموظفين متاحة للمالك والمدير فقط.
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-brand-red" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((u) => (
            <div key={u.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-red/10 text-brand-red"><UserCog className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-ink">{u.full_name || 'موظف'}</p>
                <p className="truncate text-xs text-ink-muted" dir="ltr">{u.email}</p>
              </div>
              {canManage ? (
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as UserRole)} className="rounded-xl border-2 border-line bg-white px-2 py-1.5 text-sm font-bold focus:border-brand-red focus:outline-none">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              ) : (
                <span className="badge-soft">{ROLE_LABELS[u.role]}</span>
              )}
              {canManage && (
                <button onClick={() => remove(u.id)} className={cn('grid h-9 w-9 place-items-center rounded-xl bg-ink/5 hover:bg-brand-red hover:text-white')}><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="موظف جديد">
        <div className="space-y-4">
          <div><label className="field-label">الاسم الكامل</label><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="field" /></div>
          <div><label className="field-label">البريد الإلكتروني</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" className="field text-right" /></div>
          <div><label className="field-label">كلمة المرور</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field" placeholder="6 أحرف على الأقل" /></div>
          <div>
            <label className="field-label">الدور</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="field">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <button onClick={createStaff} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إنشاء الحساب'}</button>
        </div>
      </Modal>
    </>
  );
}
