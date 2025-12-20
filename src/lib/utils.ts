/**
 * Utility Functions
 * Pure functions with no side effects - Easy to test
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCALE, CURRENCY } from '@/constants';

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

// ============================================================================
// ID GENERATION
// ============================================================================

export function generateId(): string {
  return crypto.randomUUID();
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

export function generateInvoiceNumber(existingNumbers: string[]): string {
  const year = new Date().getFullYear();
  const yearPrefix = `${year}-`;
  
  const yearNumbers = existingNumbers
    .filter(num => num.startsWith(yearPrefix))
    .map(num => parseInt(num.split('-')[1], 10))
    .filter(num => !isNaN(num));

  const maxSeq = yearNumbers.length > 0 ? Math.max(...yearNumbers) : 0;
  return `${year}-${String(maxSeq + 1).padStart(4, '0')}`;
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
