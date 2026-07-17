export const NONCE_TTL_MS = 600_000;

export interface NonceRecord {
  publicKey: string;
  nonce: string;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
}

export class NonceValidationError extends Error {
  constructor(public readonly code: 'missing' | 'missing_fields' | 'unavailable' | 'consumed' | 'expired') {
    super(code);
    this.name = 'NonceValidationError';
  }
}

export function buildNonceDocId(publicKey: string, nonce: string): string {
  return `${publicKey}_${nonce}`;
}

export function isNonceValid(record: NonceRecord | undefined, now: number = Date.now()): boolean {
  if (!record) return false;
  if (record.consumed) return false;
  if (record.expiresAt < now) return false;
  return true;
}

export function buildNonceRecord(publicKey: string, nonce: string, now: number = Date.now()): NonceRecord {
  return {
    publicKey,
    nonce,
    createdAt: now,
    expiresAt: now + NONCE_TTL_MS,
    consumed: false,
  };
}

export function assertValidNonceInputs(args: { publicKey?: unknown; nonce?: unknown }): asserts args is { publicKey: string; nonce: string } {
  if (typeof args.publicKey !== 'string' || typeof args.nonce !== 'string' || !args.publicKey || !args.nonce) {
    throw new NonceValidationError('missing_fields');
  }
}