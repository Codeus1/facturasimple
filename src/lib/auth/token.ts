import { AUTH_CONFIG } from './config';
import type { SessionPayload, SessionUser } from './types';

function base64UrlEncode(input: string | ArrayBuffer | Uint8Array): string {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sign(data: string): Promise<string> {
  const secret = AUTH_CONFIG.encryptionKey;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createToken(user: SessionUser): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + AUTH_CONFIG.tokenTTL;
  const payload: SessionPayload = { ...user, iat, exp };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT', iss: AUTH_CONFIG.issuer }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export async function verifyToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSignature = await sign(`${header}.${body}`);
  if (expectedSignature !== signature) return null;

  try {
    const decoded = new TextDecoder().decode(base64UrlDecode(body));
    const payload = JSON.parse(decoded) as SessionPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (error) {
    console.error('Failed to parse token', error);
    return null;
  }
}
