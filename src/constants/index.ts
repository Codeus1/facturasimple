/**
 * Application Constants
 * Centralized configuration values - Single Source of Truth
 */

// ============================================================================
// TAX RATES (Spain)
// ============================================================================

export const VAT_RATES = [
  { value: 0.21, label: '21% (General)' },
  { value: 0.10, label: '10% (Reducido)' },
  { value: 0.04, label: '4% (Superreducido)' },
  { value: 0, label: '0% (Exento)' },
] as const;

export const IRPF_RATE = 0.15;

export const DEFAULT_VAT_RATE = 0.21;
export const DEFAULT_IRPF_RATE = 0;

// ============================================================================
// INVOICE DEFAULTS
// ============================================================================

/** Default due date offset in milliseconds (30 days) */
export const DEFAULT_DUE_DATE_OFFSET_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_FISCAL_SERIES = 'FS';
/** Plazo máximo de pago permitido por normativa local (60 días) */
export const MAX_PAYMENT_TERM_DAYS = 60;
export const INVOICE_SEQUENCE_PADDING = 4;

// ============================================================================
// ISSUER INFO (Your company)
// ============================================================================

export const ISSUER_INFO = {
  name: 'Mi Empresa S.L.',
  nif: 'B-12345678',
  address: 'Calle Innovación 10, 28001 Madrid',
  email: 'contabilidad@miempresa.com',
} as const;

// ============================================================================
// APP CONFIG
// ============================================================================

export const APP_CONFIG = {
  name: 'FacturaSimple',
  version: '1.0.0',
  storageKey: 'factura-simple-storage',
  storageVersion: 1,
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  DASHBOARD: '/',
  CLIENTS: '/clients',
  INVOICES: '/invoices',
  INVOICE_NEW: '/invoices/new',
  INVOICE_DETAIL: (id: string) => `/invoices/${id}`,
} as const;

// ============================================================================
// DATE/TIME FORMAT
// ============================================================================

export const LOCALE = 'es-ES';
export const CURRENCY = 'EUR';
