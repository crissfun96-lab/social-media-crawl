'use server';

import { redirect } from 'next/navigation';
import { userRegisterSchema } from '@/lib/validation';

export type RegisterState =
  | { error: string }
  | { success: true }
  | undefined;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = userRegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed';
    return { error: firstError };
  }

  const { name, email, password } = parsed.data;

  // Confirm password check
  const confirmPassword = formData.get('confirm_password') as string;
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? 'Registration failed. Please try again.' };
    }
  } catch {
    return { error: 'Registration failed. Please try again.' };
  }

  redirect('/login?registered=true');
}
