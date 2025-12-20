/**
 * Custom Hook: useInvoices
 * Encapsulates all invoice-related operations
 * 
 * Principle: Single source of truth for invoice operations
 */

import { useMemo, useCallback } from 'react';
import { useAppStore, selectInvoices, selectClients } from '@/store';
import type { Invoice, InvoiceStatus } from '@/types';
import { storeInvoiceRepository } from '@/data/repositories/storeInvoiceRepository';
import { setInvoiceStatus, cancelInvoice, deleteDraftInvoice, saveInvoice as saveInvoiceUseCase } from '@/domain/usecases/invoices';

export function useInvoices() {
  // Store selectors
  const invoices = useAppStore(selectInvoices);
  const clients = useAppStore(selectClients);
  
  // Store actions
  const saveInvoiceToStore = useAppStore(state => state.saveInvoice);
  const updateInvoiceStatus = useAppStore(state => state.updateInvoiceStatus);
  const cancelInvoiceInStore = useAppStore(state => state.cancelInvoice);
  const deleteInvoiceFromStore = useAppStore(state => state.deleteInvoice);
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
    async (invoice: Invoice, clientName?: string) => {
      const enriched: Invoice = {
        ...invoice,
        clientName: clientName ?? getClientById(invoice.clientId)?.name,
      };
      await saveInvoiceUseCase(storeInvoiceRepository, enriched);
      // Keep store action for reactivity (use cases already use store repo, but this maintains compatibility if store changes)
      saveInvoiceToStore(enriched);
    },
    [getClientById, saveInvoiceToStore]
  );

  const markAsPaid = useCallback(
    (id: string) => updateInvoiceStatus(id, 'PAID'),
    [updateInvoiceStatus]
  );

  const markAsPending = useCallback(
    (id: string) => updateInvoiceStatus(id, 'PENDING'),
    [updateInvoiceStatus]
  );

  const cancel = useCallback(
    async (id: string) => {
      await cancelInvoice(storeInvoiceRepository, id);
      cancelInvoiceInStore(id);
    },
    [cancelInvoiceInStore]
  );

  const remove = useCallback(
    async (id: string) => {
      const deleted = await deleteDraftInvoice(storeInvoiceRepository, id);
      if (deleted) {
        deleteInvoiceFromStore(id);
      }
      return deleted;
    },
    [deleteInvoiceFromStore]
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
    saveInvoice: saveInvoiceToStore,
    remove,
    cancel,
    markAsPaid,
    markAsPending,
  };
}
