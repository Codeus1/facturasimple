import { APP_CONFIG } from '@/constants';

const ONE_DAY_SECONDS = 60 * 60 * 24;

export const AUTH_CONFIG = {
  cookieName: 'fsession',
  defaultTenant: 'public',
  tokenTTL: ONE_DAY_SECONDS,
  encryptionKey: process.env.AUTH_SECRET || process.env.NEXT_PUBLIC_CRYPTO_KEY || APP_CONFIG.name,
  issuer: 'facturasimple',
  demoUser: {
    email: process.env.AUTH_DEMO_EMAIL || 'demo@facturasimple.local',
    password: process.env.AUTH_DEMO_PASSWORD || 'demo1234',
    id: process.env.AUTH_DEMO_USER_ID || 'demo-user',
    tenantId: process.env.AUTH_DEMO_TENANT_ID || 'public',
    name: process.env.AUTH_DEMO_USER_NAME || 'Demo User',
  },
};
