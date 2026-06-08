import { createHmac, timingSafeEqual } from 'crypto';

/**
 * جلسة السائق عبر كوكي موقّع (HMAC) — بدون مكتبات خارجية.
 * تُستخدم في API والصفحات الخادمية فقط.
 */
export const DRIVER_COOKIE = 'mp_driver';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 أيام

function secret(): string {
  return process.env.DRIVER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'mr-pizza-driver-dev-secret';
}

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

export function signDriverToken(driverId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = b64url(`${driverId}.${exp}`);
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyDriverToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const [driverId, expStr] = decoded.split('.');
  const exp = Number(expStr);
  if (!driverId || !exp || exp < Math.floor(Date.now() / 1000)) return null;
  return driverId;
}

export const driverCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};
