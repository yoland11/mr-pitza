'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { playAlertSound, useAdminNotify } from '@/lib/store/adminNotify';
import { toast } from '@/lib/store/toast';

/**
 * يفحص الطلبات الجديدة (تم استلام الطلب) كل 5 ثوانٍ.
 * عند وصول طلب جديد: Toast + صوت تنبيه (مرة واحدة لكل طلب).
 * يحدّث عدّاد الطلبات الجديدة في الهيدر.
 */
export function NewOrdersWatcher() {
  const seenRef = useRef<Set<string>>(new Set());
  const initRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const poll = async () => {
      const { data, count } = await supabase
        .from('orders')
        .select('id, code', { count: 'exact' })
        .eq('status', 'received')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!active || !data) return;

      const store = useAdminNotify.getState();
      store.setNewCount(count ?? data.length);

      if (!initRef.current) {
        // أول فحص: نسجّل الموجود دون تنبيه
        data.forEach((o) => seenRef.current.add(o.id));
        initRef.current = true;
        return;
      }

      const fresh = data.filter((o) => !seenRef.current.has(o.id));
      if (fresh.length > 0) {
        const soundOn = useAdminNotify.getState().soundEnabled;
        if (soundOn) playAlertSound();
        fresh.forEach((o) => {
          seenRef.current.add(o.id);
          toast.success(`🔔 طلب جديد ${o.code}`);
        });
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return null;
}
