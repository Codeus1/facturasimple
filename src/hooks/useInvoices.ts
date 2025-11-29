/**
 * Custom Hook: useInvoices
 * Encapsulates all invoice-related operations
 * 
 * Principle: Single source of truth for invoice operations
 */

import { useMemo, useCallback } from 'react';
import { useAppStore, selectInvoices, selectClients } from '@/src/store';
import type { Invoice, InvoiceStatus } from '@/src/types';

export function useInvoices() {
  // Store selectors
  const invoices = useAppStore(selectInvoices);
  const clients = useAppStore(selectClients);
  
  // Store actions
  const saveInvoice = useAppStore(state => state.saveInvoice);
  const updateInvoiceStatus = useAppStore(state => state.updateInvoiceStatus);
  const cancelInvoice = useAppStore(state => state.cancelInvoice);
  const deleteInvoice = useAppStore(state => state.deleteInvoice);
  const getInvoiceById = useAppStore(state => state.getInvoiceById);
  const getNextInvoiceNumber = useAppStore(state => state.getNextInvoiceNumber);
  const getClientById = useAppStore(state => state.getClientById);

  // Derived data
  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => b.issueDate - a.issueDate),
    [invoices]
  );

  const recentInvoices = useMemo(
    () => sortedInvoices.slice(0, 5),
    [sortedInvoices]
  );

  // Query operations
  const filterByStatus = useCallback(
    (status: InvoiceStatus | 'ALL') => {
      if (status === 'ALL') return sortedInvoices;
      return sortedInvoices.filter(inv => inv.status === status);
    },
    [sortedInvoices]
  );

  const getInvoiceWithClient = useCallback(
    (invoiceId: string) => {
      const invoice = getInvoiceById(invoiceId);
      if (!invoice) return null;
      return { invoice, client: getClientById(invoice.clientId) };
    },
    [getInvoiceById, getClientById]
  );

  // Mutation operations
  const save = useCallback(
    (invoice: Invoice, clientName?: string) => {
      saveInvoice({
        ...invoice,
        clientName: clientName ?? getClientById(invoice.clientId)?.name,
      });
    },
    [saveInvoice, getClientById]
  );

  const markAsPaid = useCallback(
    (id: string) => updateInvoiceStatus(id, 'PAID'),
    [updateInvoiceStatus]
  );

  const markAsPending = useCallback(
    (id: string) => updateInvoiceStatus(id, 'PENDING'),
    [updateInvoiceStatus]
  );

  return {
    // Data
    invoices,
    sortedInvoices,
    recentInvoices,
    clients,
    invoiceCount: invoices.length,
    
    // Queries
    filterByStatus,
    getInvoiceById,
    getInvoiceWithClient,
    getClientById,
    getNextInvoiceNumber,
    
    // Mutations
    save,
    saveInvoice,
    remove: deleteInvoice,
    cancel: cancelInvoice,
    markAsPaid,
    markAsPending,
  };
}
