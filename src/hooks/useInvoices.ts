/**
 * Custom Hook: useInvoices
 * Encapsulates all invoice-related operations
 */

import { useMemo, useCallback } from 'react';
import { useAppStore, selectInvoices, selectClients } from '@/src/store';
import type { Invoice, InvoiceStatus } from '@/src/types';

export function useInvoices() {
  const invoices = useAppStore(selectInvoices);
  const clients = useAppStore(selectClients);
  const saveInvoice = useAppStore(state => state.saveInvoice);
  const updateInvoiceStatus = useAppStore(state => state.updateInvoiceStatus);
  const cancelInvoice = useAppStore(state => state.cancelInvoice);
  const deleteInvoice = useAppStore(state => state.deleteInvoice);
  const getInvoiceById = useAppStore(state => state.getInvoiceById);
  const getNextInvoiceNumber = useAppStore(state => state.getNextInvoiceNumber);
  const getClientById = useAppStore(state => state.getClientById);

  // Sort by issue date descending (most recent first)
  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => b.issueDate - a.issueDate),
    [invoices]
  );

  const recentInvoices = useMemo(
    () => sortedInvoices.slice(0, 5),
    [sortedInvoices]
  );

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
      const client = getClientById(invoice.clientId);
      return { invoice, client };
    },
    [getInvoiceById, getClientById]
  );

  const save = useCallback(
    (invoice: Invoice, clientName?: string) => {
      const finalInvoice: Invoice = {
        ...invoice,
        clientName: clientName ?? getClientById(invoice.clientId)?.name,
      };
      saveInvoice(finalInvoice);
    },
    [saveInvoice, getClientById]
  );

  const markAsPaid = useCallback(
    (id: string) => {
      updateInvoiceStatus(id, 'PAID');
    },
    [updateInvoiceStatus]
  );

  const markAsPending = useCallback(
    (id: string) => {
      updateInvoiceStatus(id, 'PENDING');
    },
    [updateInvoiceStatus]
  );

  const cancel = useCallback(
    (id: string) => {
      cancelInvoice(id);
    },
    [cancelInvoice]
  );

  /**
   * Elimina una factura. Solo funciona con borradores (DRAFT).
   * @returns true si se eliminó, false si no era un borrador
   */
  const remove = useCallback(
    (id: string): boolean => {
      return deleteInvoice(id);
    },
    [deleteInvoice]
  );

  return {
    invoices,
    sortedInvoices,
    recentInvoices,
    filterByStatus,
    getInvoiceById,
    getInvoiceWithClient,
    getNextInvoiceNumber,
    save,
    saveInvoice,
    deleteInvoice,
    remove,
    cancel,
    cancelInvoice,
    updateInvoiceStatus,
    markAsPaid,
    markAsPending,
    invoiceCount: invoices.length,
    clients,
    getClientById,
  };
}
