/**
 * Utility Functions
 * Pure functions with no side effects - Easy to test
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCALE, CURRENCY } from '@/constants';
import { DEFAULT_FISCAL_SERIES, INVOICE_SEQUENCE_PADDING, MAX_PAYMENT_TERM_DAYS } from '@/constants';

// ============================================================================
// CLASS NAME UTILITIES (Tailwind)
// ============================================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDate(timestamp: number): string {
  return dateFormatter.format(new Date(timestamp));
}

export function formatDateForInput(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

export function parseInputDate(dateString: string): number {
  return new Date(dateString).getTime();
}

export function getFiscalYearFromDate(timestamp: number): number {
  return new Date(timestamp).getFullYear();
}

// ============================================================================
// ID GENERATION
// ============================================================================

export function generateId(): string {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;

  if (cryptoObj) {
    if (typeof cryptoObj.randomUUID === 'function') {
      return cryptoObj.randomUUID();
    }

    if (typeof cryptoObj.getRandomValues === 'function') {
      const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
      return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ============================================================================
// INVOICE CALCULATIONS
// ============================================================================

export interface InvoiceCalculationParams {
  items: Array<{ quantity: number; priceUnit: number }>;
  vatRate: number;
  irpfRate: number;
  taxesIncluded?: boolean; // Si true, los precios ya incluyen impuestos
}

export interface InvoiceCalculationResult {
  baseTotal: number;
  vatAmount: number;
  irpfAmount: number;
  totalAmount: number;
  itemSubtotals: number[];
  netPrices: number[]; // Precios netos (sin impuestos) por item
}

/**
 * Calcula los totales de una factura.
 * 
 * Si taxesIncluded = false (por defecto):
 *   - Los precios son NETOS (base imponible)
 *   - Total = Base + IVA - IRPF
 * 
 * Si taxesIncluded = true:
 *   - Los precios son BRUTOS (impuestos incluidos)
 *   - Se desglosa hacia atrás: Base = Total / (1 + IVA - IRPF)
 */
export function calculateInvoiceTotals(params: InvoiceCalculationParams): InvoiceCalculationResult {
  const { items, vatRate, irpfRate, taxesIncluded = false } = params;
  
  const itemGrossTotals = items.map(item => item.quantity * item.priceUnit);
  const grossTotal = itemGrossTotals.reduce((sum, subtotal) => sum + subtotal, 0);

  let baseTotal: number;
  let vatAmount: number;
  let irpfAmount: number;
  let totalAmount: number;
  let netPrices: number[];

  if (taxesIncluded) {
    // Desglosar desde precio bruto (impuestos incluidos)
    // Fórmula: Base = Bruto / (1 + IVA - IRPF)
    const taxMultiplier = 1 + vatRate - irpfRate;
    baseTotal = grossTotal / taxMultiplier;
    vatAmount = baseTotal * vatRate;
    irpfAmount = baseTotal * irpfRate;
    totalAmount = grossTotal; // El total es lo que el usuario introdujo
    
    // Calcular precios netos por item
    netPrices = itemGrossTotals.map(gross => gross / taxMultiplier);
  } else {
    // Cálculo normal: precios son base imponible
    baseTotal = grossTotal;
    vatAmount = baseTotal * vatRate;
    irpfAmount = baseTotal * irpfRate;
    totalAmount = baseTotal + vatAmount - irpfAmount;
    netPrices = itemGrossTotals; // Los precios ya son netos
  }

  return {
    baseTotal,
    vatAmount,
    irpfAmount,
    totalAmount,
    itemSubtotals: itemGrossTotals,
    netPrices,
  };
}

// ============================================================================
// INVOICE NUMBER GENERATION
// ============================================================================

export interface InvoiceNumberParts {
  series: string;
  fiscalYear: number;
  sequence: number;
}

export function buildInvoiceNumber(
  series: string,
  fiscalYear: number,
  sequence: number,
  padding: number = INVOICE_SEQUENCE_PADDING
): string {
  return `${series}-${fiscalYear}-${String(sequence).padStart(padding, '0')}`;
}

export function parseInvoiceNumber(
  invoiceNumber: string,
  fallbackSeries = DEFAULT_FISCAL_SERIES
): InvoiceNumberParts | null {
  const normalized = invoiceNumber.trim();
  const patterns = [
    /^(?<series>[A-Za-z0-9]+)-(?<year>\d{4})-(?<sequence>\d{3,})$/,
    /^(?<year>\d{4})-(?<sequence>\d{3,})$/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.groups) {
      const fiscalYear = Number(match.groups.year);
      const sequence = Number(match.groups.sequence);
      if (!Number.isNaN(fiscalYear) && !Number.isNaN(sequence)) {
        return {
          series: match.groups.series || fallbackSeries,
          fiscalYear,
          sequence,
        };
      }
    }
  }
  return null;
}

export function generateInvoiceNumber(
  existingNumbers: string[],
  series: string,
  fiscalYear: number
): InvoiceNumberParts & { invoiceNumber: string } {
  const existingSequences = existingNumbers
    .map(num => parseInvoiceNumber(num, series))
    .filter((parts): parts is InvoiceNumberParts => !!parts)
    .filter(parts => parts.series === series && parts.fiscalYear === fiscalYear)
    .map(parts => parts.sequence);

  const maxSeq = existingSequences.length > 0 ? Math.max(...existingSequences) : 0;
  const nextSequence = maxSeq + 1;

  return {
    series,
    fiscalYear,
    sequence: nextSequence,
    invoiceNumber: buildInvoiceNumber(series, fiscalYear, nextSequence),
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidNIF(nif: string): boolean {
  return nif.length >= 5;
}

export function isPaymentTermValid(
  issueDate: number,
  dueDate: number,
  maxTermDays: number = MAX_PAYMENT_TERM_DAYS
): boolean {
  if (Number.isNaN(issueDate) || Number.isNaN(dueDate)) return false;
  if (dueDate < issueDate) return false;

  const maxTermMs = maxTermDays * 24 * 60 * 60 * 1000;
  return dueDate - issueDate <= maxTermMs;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export function updateById<T extends { id: string }>(array: T[], item: T): T[] {
  return array.map(i => (i.id === item.id ? item : i));
}

export function removeById<T extends { id: string }>(array: T[], id: string): T[] {
  return array.filter(i => i.id !== id);
}

export function findById<T extends { id: string }>(array: T[], id: string): T | undefined {
  return array.find(i => i.id === id);
}
