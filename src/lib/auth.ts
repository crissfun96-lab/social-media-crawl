import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'smc_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

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

export function createSessionToken(username: string): string {
  const secret = getAuthSecret();
  const payload = JSON.stringify({ username, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  // Simple HMAC-like token: base64(payload).base64(hmac)
  // For production use a proper JWT library, but this is secure enough for a single-user admin app
  const { createHmac } = require('crypto') as typeof import('crypto');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifySessionToken(token: string): { username: string } | null {
  try {
    const secret = getAuthSecret();
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

    const { createHmac } = require('crypto') as typeof import('crypto');
    const expectedSig = createHmac('sha256', secret)
      .update(Buffer.from(payloadB64, 'base64url').toString())
      .digest('base64url');

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
      username: string;
      exp: number;
    };

    if (payload.exp < Date.now()) return null;

    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ username: string } | null> {
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

export async function setSessionCookie(username: string): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken(username);
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
