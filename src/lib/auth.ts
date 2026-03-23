import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/types/database';

const SESSION_COOKIE = 'smc_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionData {
  readonly username: string;
  readonly role: UserRole;
  readonly userId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET env var is not set');
  return secret;
}

export function createSessionToken(username: string, role: UserRole = 'staff', userId: string = ''): string {
  const secret = getAuthSecret();
  const payload = JSON.stringify({ username, role, userId, exp: Date.now() + SESSION_MAX_AGE * 1000 });

  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    const secret = getAuthSecret();
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

  
    const expectedSig = createHmac('sha256', secret)
      .update(Buffer.from(payloadB64, 'base64url').toString())
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
      username: string;
      role?: UserRole;
      userId?: string;
      exp: number;
    };

    if (payload.exp < Date.now()) return null;

    return {
      username: payload.username,
      role: payload.role ?? 'staff',
      userId: payload.userId ?? '',
    };
  } catch {
    return null;
  }
}

/** Get session (backwards-compatible: returns {username} at minimum) */
export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Get session with full role info */
export async function getSessionWithRole(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(): Promise<{ username: string }> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/** Require auth and return full session with role */
export async function requireAuthWithRole(): Promise<SessionData> {
  const session = await getSessionWithRole();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/** Require admin role — redirects to / if not admin */
export async function requireAdmin(): Promise<SessionData> {
  const session = await requireAuthWithRole();
  if (session.role !== 'admin') {
    redirect('/');
  }
  return session;
}

/** Check if session belongs to an admin */
export function isAdmin(session: SessionData | null): boolean {
  return session?.role === 'admin';
}

export async function setSessionCookie(username: string, role: UserRole = 'staff', userId: string = ''): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken(username, role, userId);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
