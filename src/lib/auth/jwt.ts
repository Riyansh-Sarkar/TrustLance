import crypto from 'crypto';

export function signNonce(nonce: string, expiresAt: number): string {
  const secret = process.env.JWT_SECRET || 'fallback_dev_secret';
  const payload = `${nonce}.${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}.${signature}`;
}

export function verifySignedNonce(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [nonce, expiresAtStr] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  
  if (Date.now() > expiresAt) return null;
  
  const expectedToken = signNonce(nonce, expiresAt);
  if (expectedToken !== token) return null;
  
  return nonce;
}

export function createFirebaseCustomToken(uid: string): string {
  return `session-token-${uid}-${Date.now()}`;
}
