'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminNotifyState {
  newCount: number; // عدد الطلبات بحالة «تم استلام الطلب»
  soundEnabled: boolean; // صوت التنبيه على هذا الجهاز
  seenIds: string[]; // معرّفات الطلبات التي نُبّه لها مسبقاً (منع التكرار)
  initialized: boolean;
  setNewCount: (n: number) => void;
  markSeen: (ids: string[]) => void;
  decrement: () => void;
  setInitialized: (v: boolean) => void;
  toggleSound: () => void;
}

export const useAdminNotify = create<AdminNotifyState>()(
  persist(
    (set) => ({
      newCount: 0,
      soundEnabled: true,
      seenIds: [],
      initialized: false,
      setNewCount: (n) => set({ newCount: Math.max(0, n) }),
      markSeen: (ids) => set((s) => ({ seenIds: Array.from(new Set([...s.seenIds, ...ids])).slice(-200) })),
      decrement: () => set((s) => ({ newCount: Math.max(0, s.newCount - 1) })),
      setInitialized: (v) => set({ initialized: v }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: 'mr-pizza-admin-notify',
      partialize: (s) => ({ soundEnabled: s.soundEnabled }),
    },
  ),
);

/** نغمة تنبيه قصيرة عبر Web Audio API — بدون ملفات أو مكتبات */
let audioCtx: AudioContext | null = null;
export function playAlertSound() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const now = audioCtx.currentTime;
    // نغمتان قصيرتان متتاليتان
    [0, 0.18].forEach((offset, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 880 : 1175;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } catch {
    /* تجاهل بصمت */
  }
}
