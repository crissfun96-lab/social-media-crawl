import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register — Social Media Crawl',
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect('/');

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-4">
            SC
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Create Account</h1>
          <p className="text-sm text-zinc-400 mt-1">Join the Creator Management Dashboard</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
