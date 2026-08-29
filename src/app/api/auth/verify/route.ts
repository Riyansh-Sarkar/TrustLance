import { NextResponse } from 'next/server';
import { Keypair, Networks, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { createHash } from 'crypto';
import { rateLimit, rateLimitHeaders } from '@/lib/auth/rate-limit';
import { verifySignedNonce, createFirebaseCustomToken } from '@/lib/auth/jwt';

const AUTH_MANAGE_DATA_NAME = 'TrustLance Auth';

function verifyAuthTransaction(publicKey: string, nonce: string, authTransactionXdr: string): boolean {
  const tx = TransactionBuilder.fromXDR(authTransactionXdr, Networks.TESTNET);
  if (!(tx instanceof Transaction) || tx.source !== publicKey || tx.operations.length !== 1) {
    return false;
  }

  const operation = tx.operations[0];
  if (operation.type !== 'manageData' || operation.name !== AUTH_MANAGE_DATA_NAME) {
    return false;
  }

  if (!Buffer.isBuffer(operation.value) || operation.value.toString('utf8') !== nonce || tx.signatures.length === 0) {
    return false;
  }

  const keypair = Keypair.fromPublicKey(publicKey);
  return tx.signatures.some((signature) => keypair.verify(tx.hash(), signature.signature()));
}

export async function POST(req: Request) {
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

  try {
    const { publicKey, signature, nonce, authTransactionXdr } = await req.json();

    if (!publicKey || !nonce || (!signature && !authTransactionXdr)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract the nonceToken from cookies
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [k, ...v] = c.split('=');
        return [k, v.join('=')];
      })
    );
    const nonceToken = cookies['fp_nonce_token'];

    if (!nonceToken) {
      return NextResponse.json(
        { error: 'Nonce token not found in cookies. Request /api/auth/nonce first.' },
        { status: 401 }
      );
    }

    const validNonce = verifySignedNonce(nonceToken);
    if (!validNonce) {
      return NextResponse.json(
        { error: 'Nonce has expired or is invalid. Request a new one.' },
        { status: 401 }
      );
    }

    if (validNonce !== nonce) {
      return NextResponse.json(
        { error: 'Nonce mismatch.' },
        { status: 401 }
      );
    }

    if (signature === "mock_signature_for_playwright" && process.env.NODE_ENV !== "production") {
      // Bypass signature verification for e2e tests
    } else if (authTransactionXdr) {
      let isValid = false;
      try {
        isValid = verifyAuthTransaction(publicKey, nonce, authTransactionXdr);
      } catch {
        return NextResponse.json(
          { error: 'Invalid auth transaction' },
          { status: 400 }
        );
      }

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid auth transaction signature' },
          { status: 401 }
        );
      }
    } else {
      let signatureBuffer: Buffer;
      try {
        signatureBuffer = Buffer.from(signature, 'base64');
      } catch {
        return NextResponse.json(
          { error: 'Invalid signature encoding' },
          { status: 400 }
        );
      }

      const messageBuffer = Buffer.from('Stellar Signed Message:\n' + nonce);
      const dataBuffer = createHash('sha256').update(messageBuffer).digest();

      let keypair: Keypair;
      try {
        keypair = Keypair.fromPublicKey(publicKey);
      } catch {
        return NextResponse.json(
          { error: 'Invalid public key' },
          { status: 400 }
        );
      }

      const isValid = keypair.verify(dataBuffer, signatureBuffer);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Create custom token using pure JS crypto (bypassing firebase-admin entirely!)
    const customToken = createFirebaseCustomToken(publicKey);

    // Clear the nonce cookie
    const res = NextResponse.json({ customToken });
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    res.cookies.set('fp_nonce_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (error) {
    console.error('Auth verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: process.env.NODE_ENV !== 'production' ? errorMessage : 'Internal server error' },
      { status: 500 }
    );
  }
}
