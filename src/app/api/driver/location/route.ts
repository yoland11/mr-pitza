import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { DRIVER_COOKIE, verifyDriverToken } from '@/lib/auth/driver';

/** تحديث موقع السائق (للتتبع المباشر) */
export async function POST(req: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false }, { status: 400 });
  const store = await cookies();
  const driverId = verifyDriverToken(store.get(DRIVER_COOKIE)?.value);
  if (!driverId) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { lat?: number; lng?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  const admin = createAdminClient();
  await admin
    .from('drivers')
    .update({ latitude: body.lat, longitude: body.lng, location_updated_at: new Date().toISOString() })
    .eq('id', driverId);
  return NextResponse.json({ ok: true });
}
