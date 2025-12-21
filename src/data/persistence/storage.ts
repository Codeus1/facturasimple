/**
 * Validated, versioned storage adapter for Zustand persistence.
 * - Validates persisted data with Zod
 * - Migrates legacy payloads without version
 */
import { z } from 'zod';
import { createJSONStorage } from 'zustand/middleware';
import { APP_CONFIG } from '@/constants';
import { clientSchema, invoiceSchema } from '@/domain/entities';

const STORAGE_VERSION = APP_CONFIG.storageVersion ?? 1;
const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY || APP_CONFIG.name;

function xorCipher(input: string, key: string): string {
  const keyLength = key.length;
  return input
    .split('')
    .map((char, idx) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(idx % keyLength)))
    .join('');
}

function encrypt(value: string): string {
  const cipherText = xorCipher(value, SECRET_KEY);
  return btoa(cipherText);
}

function decrypt(value: string): string {
  try {
    const decoded = atob(value);
    return xorCipher(decoded, SECRET_KEY);
  } catch {
    return value;
  }
}

const persistedStateSchema = z.object({
  version: z.number().int().nonnegative().default(0),
  state: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    clients: z.array(clientSchema).default([]),
    invoices: z.array(invoiceSchema).default([]),
  }),
});

type PersistedState = z.infer<typeof persistedStateSchema>['state'];

function normalize(raw: unknown): PersistedState {
  // Support legacy shape (state stored directly without version)
  const parsed =
    raw && typeof raw === 'object' && 'state' in (raw as Record<string, unknown>)
      ? raw
      : { version: 0, state: raw };

  const result = persistedStateSchema.safeParse(parsed);
  if (!result.success) {
    console.warn('Invalid persisted state, resetting storage', result.error?.errors);
    return { theme: 'light', clients: [], invoices: [] };
  }
  return result.data.state;
}

/**
 * Storage adapter to plug into Zustand's persist middleware.
 */
export const validatedStorage = createJSONStorage(() => ({
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const decrypted = decrypt(raw);
      const parsed = JSON.parse(decrypted);
      const normalized = normalize(parsed);
      return JSON.stringify(normalized);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const parsed = JSON.parse(value);
      const wrapped = { version: STORAGE_VERSION, state: parsed };
      const encrypted = encrypt(JSON.stringify(wrapped));
      localStorage.setItem(name, encrypted);
    } catch {
      // Swallow errors to avoid breaking UI; caller can handle persistence failures.
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}));
