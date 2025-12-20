/**
 * useInvoiceSearch Hook
 * Handles searching and filtering invoices with multiple criteria
 * 
 * Single Responsibility: Only handles invoice search/filter logic
 * Open/Closed: Easy to add new filter criteria without modifying existing ones
 */

import { useMemo } from 'react';
import type { Invoice, InvoiceStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceSearchFilters {
  /** Text search (invoice number, client name) */
  query: string;
  /** Filter by status */
  status: InvoiceStatus | 'ALL';
  /** Filter by client ID */
  clientId: string | 'ALL';
  /** Filter by date range - start */
  dateFrom: number | null;
  /** Filter by date range - end */
  dateTo: number | null;
  /** Filter by amount range - min */
  amountMin: number | null;
  /** Filter by amount range - max */
  amountMax: number | null;
}

export const DEFAULT_FILTERS: InvoiceSearchFilters = {
  query: '',
  status: 'ALL',
  clientId: 'ALL',
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
};

// ============================================================================
// FILTER FUNCTIONS (Strategy Pattern - each filter is independent)
// ============================================================================

type FilterFn = (invoice: Invoice, filters: InvoiceSearchFilters) => boolean;

const filterByQuery: FilterFn = (invoice, filters) => {
  if (!filters.query.trim()) return true;
  
  const searchLower = filters.query.toLowerCase().trim();
  const invoiceNumber = invoice.invoiceNumber.toLowerCase();
  const clientName = (invoice.clientName || '').toLowerCase();
  
  return invoiceNumber.includes(searchLower) || clientName.includes(searchLower);
};

const filterByStatus: FilterFn = (invoice, filters) => {
  if (filters.status === 'ALL') return true;
  return invoice.status === filters.status;
};

const filterByClient: FilterFn = (invoice, filters) => {
  if (filters.clientId === 'ALL') return true;
  return invoice.clientId === filters.clientId;
};

const filterByDateRange: FilterFn = (invoice, filters) => {
  const { dateFrom, dateTo } = filters;
  
  if (dateFrom && invoice.issueDate < dateFrom) return false;
  if (dateTo) {
    // Add 24 hours to include the entire end date
    const endOfDay = dateTo + 24 * 60 * 60 * 1000 - 1;
    if (invoice.issueDate > endOfDay) return false;
  }
  
  return true;
};

const filterByAmountRange: FilterFn = (invoice, filters) => {
  const { amountMin, amountMax } = filters;
  
  if (amountMin !== null && invoice.totalAmount < amountMin) return false;
  if (amountMax !== null && invoice.totalAmount > amountMax) return false;
  
  return true;
};

// Compose all filters
const allFilters: FilterFn[] = [
  filterByQuery,
  filterByStatus,
  filterByClient,
  filterByDateRange,
  filterByAmountRange,
];

// ============================================================================
// HOOK
// ============================================================================

export function useInvoiceSearch(
  invoices: Invoice[],
  filters: InvoiceSearchFilters
): Invoice[] {
  return useMemo(() => {
    return invoices.filter(invoice => 
      allFilters.every(filterFn => filterFn(invoice, filters))
    );
  }, [invoices, filters]);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Checks if any filter is active (different from default)
 */
export function hasActiveFilters(filters: InvoiceSearchFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.status !== 'ALL' ||
    filters.clientId !== 'ALL' ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.amountMin !== null ||
    filters.amountMax !== null
  );
}

/**
 * Counts active filters for UI badge
 */
export function countActiveFilters(filters: InvoiceSearchFilters): number {
  let count = 0;
  if (filters.query.trim()) count++;
  if (filters.status !== 'ALL') count++;
  if (filters.clientId !== 'ALL') count++;
  if (filters.dateFrom !== null) count++;
  if (filters.dateTo !== null) count++;
  if (filters.amountMin !== null) count++;
  if (filters.amountMax !== null) count++;
  return count;
}
