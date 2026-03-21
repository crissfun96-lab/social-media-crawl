import { NextResponse } from 'next/server';

export async function POST(): Promise<Response> {
  const response = NextResponse.redirect(new URL('/login', process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'));
  response.cookies.delete('smc_session');
  return response;
}
