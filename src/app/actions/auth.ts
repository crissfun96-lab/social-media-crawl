'use server';

import { redirect } from 'next/navigation';
import { verifyPassword, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginState =
  | { error: string }
  | undefined;

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

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUsername || !expectedHash) {
    return { error: 'Server configuration error. Please contact admin.' };
  }

  const usernameMatch = username === expectedUsername;
  const passwordMatch = await verifyPassword(password, expectedHash);

  if (!usernameMatch || !passwordMatch) {
    return { error: 'Invalid username or password.' };
  }

  await setSessionCookie(username);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
