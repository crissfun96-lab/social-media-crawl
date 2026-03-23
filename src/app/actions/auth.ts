'use server';

import { redirect } from 'next/navigation';
import { verifyPassword, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import type { User } from '@/types/database';

const LoginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginState =
  | { error: string }
  | undefined;

async function findUserByEmail(email: string): Promise<User | null> {
  const snapshot = await db().collection('users').where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as User;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Please enter your username and password.' };
  }

  const { username, password } = parsed.data;

  // Try env-var admin login first (backwards compatible)
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (expectedUsername && expectedHash) {
    const usernameMatch = username === expectedUsername;
    const passwordMatch = usernameMatch ? await verifyPassword(password, expectedHash) : false;

    if (usernameMatch && passwordMatch) {
      await setSessionCookie(username, 'admin', 'env-admin');
      redirect('/');
    }
  }

  // Try Firestore user login (username field is email)
  const user = await findUserByEmail(username);
  if (user) {
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (passwordMatch) {
      await setSessionCookie(user.name, user.role, user.id);
      redirect('/');
    }
  }

  return { error: 'Invalid username or password.' };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
