import { NextResponse } from 'next/server';
import { DRIVER_COOKIE } from '@/lib/auth/driver';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DRIVER_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
