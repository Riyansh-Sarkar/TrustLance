import { NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/auth/rate-limit';
import { NONCE_TTL_MS } from '@/lib/auth/nonce';
import { signNonce } from '@/lib/auth/jwt';

export async function GET(req: Request) {
  try {
    const rl = rateLimit(req);
    const headers = rateLimitHeaders(rl);
    if (!rl.allowed) {
      const res = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
      Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    let nonce = '';
    try {
      const array = new Uint8Array(32);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
        nonce = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        nonce = Array.from({ length: 32 }).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
      }
    } catch {
      nonce = Array.from({ length: 32 }).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    }
    
    const expiresAt = Date.now() + NONCE_TTL_MS;
    const nonceToken = signNonce(nonce, expiresAt);
    
    // Set cookie so we don't have to change useWallet.ts logic!
    const res = NextResponse.json({ nonce });
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    res.cookies.set('fp_nonce_token', nonceToken, {
      httpOnly: true,
      path: '/',
      maxAge: NONCE_TTL_MS / 1000,
      sameSite: 'lax',
    });
    
    return res;
  } catch (err) {
    console.error('Nonce GET error:', err);
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req);
    const headers = rateLimitHeaders(rl);
    if (!rl.allowed) {
      const res = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
      Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Completely stateless! The cookie holds the token. 
    // We just return success to satisfy the client component.
    const res = NextResponse.json({ success: true });
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    console.error('Auth nonce error:', err);
    return NextResponse.json(
      { error: 'Failed to store nonce' },
      { status: 500 }
    );
  }
}