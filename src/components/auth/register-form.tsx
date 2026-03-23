'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/register';
import type { RegisterState } from '@/app/actions/register';
import Link from 'next/link';

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, undefined);

  return (
    <form action={action} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-5">
      {state && 'error' in state && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="John Doe"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100
            placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors min-h-[44px]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="john@example.com"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100
            placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors min-h-[44px]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Min 8 characters"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100
            placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors min-h-[44px]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-300">
          Confirm Password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repeat your password"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100
            placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors min-h-[44px]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
          text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors min-h-[44px]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {pending ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
