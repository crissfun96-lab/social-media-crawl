'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import type { LoginState } from '@/app/actions/auth';
import Link from 'next/link';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-5">
      {state?.error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          placeholder="crissfun96"
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
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
        {pending ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Register
        </Link>
      </p>
    </form>
  );
}
