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
import { useAuth } from './useAuth';
import { recordAudit } from '@/services/auditTrail';
import { ensureAuthorizedTenant } from '@/lib/security/authorization';

export function useInvoices() {
  // Store selectors
  const invoices = useAppStore(selectInvoices);
  const rawClients = useAppStore(selectClients);
  const { tenantId, userId } = useAuth();
  
  // Store actions
  const saveInvoiceToStore = useAppStore(state => state.saveInvoice);
  const updateInvoiceStatus = useAppStore(state => state.updateInvoiceStatus);
  const cancelInvoiceInStore = useAppStore(state => state.cancelInvoice);
  const deleteInvoiceFromStore = useAppStore(state => state.deleteInvoice);
  const rawGetInvoiceById = useAppStore(state => state.getInvoiceById);
  const getNextInvoiceNumber = useAppStore(state => state.getNextInvoiceNumber);
  const rawGetClientById = useAppStore(state => state.getClientById);

  // Derived data
  const scopedInvoices = useMemo(
    () => invoices.filter(inv => inv.tenantId === tenantId),
    [invoices, tenantId]
  );

  const clients = useMemo(() => rawClients.filter(client => client.tenantId === tenantId), [rawClients, tenantId]);

  const getInvoiceById = useCallback(
    (id: string) => {
      const invoice = rawGetInvoiceById(id);
      if (invoice?.tenantId !== tenantId) return undefined;
      return invoice;
    },
    [rawGetInvoiceById, tenantId]
  );

  const getClientById = useCallback(
    (id: string) => {
      const client = rawGetClientById(id);
      if (client?.tenantId !== tenantId) return undefined;
      return client;
    },
    [rawGetClientById, tenantId]
  );

  const sortedInvoices = useMemo(
    () => [...scopedInvoices].sort((a, b) => b.issueDate - a.issueDate),
    [scopedInvoices]
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
      const scopedInvoice: Invoice = {
        ...invoice,
        tenantId: invoice.tenantId || tenantId,
        ownerId: invoice.ownerId || userId,
        createdAt: invoice.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      ensureAuthorizedTenant(scopedInvoice.tenantId, tenantId);
      const existing = scopedInvoices.find(inv => inv.id === scopedInvoice.id);
      const enriched: Invoice = {
        ...scopedInvoice,
        clientName: clientName ?? getClientById(invoice.clientId)?.name,
      };
      await saveInvoiceUseCase(storeInvoiceRepository, enriched);
      // Keep store action for reactivity (use cases already use store repo, but this maintains compatibility if store changes)
      saveInvoiceToStore(enriched);
      recordAudit({
        action: existing ? 'update' : 'create',
        entity: 'invoice',
        entityId: invoice.id,
        tenantId,
        userId,
      });
    },
    [getClientById, saveInvoiceToStore, scopedInvoices, tenantId, userId]
  );

  const markAsPaid = useCallback(
    (id: string) => {
      const invoice = getInvoiceById(id);
      if (invoice) ensureAuthorizedTenant(invoice.tenantId, tenantId);
      updateInvoiceStatus(id, 'PAID');
      recordAudit({ action: 'update', entity: 'invoice', entityId: id, tenantId, userId });
    },
    [getInvoiceById, tenantId, updateInvoiceStatus, userId]
  );

  const markAsPending = useCallback(
    (id: string) => {
      const invoice = getInvoiceById(id);
      if (invoice) ensureAuthorizedTenant(invoice.tenantId, tenantId);
      updateInvoiceStatus(id, 'PENDING');
      recordAudit({ action: 'update', entity: 'invoice', entityId: id, tenantId, userId });
    },
    [getInvoiceById, tenantId, updateInvoiceStatus, userId]
  );

  const cancel = useCallback(
    async (id: string) => {
      const invoice = getInvoiceById(id);
      if (invoice) ensureAuthorizedTenant(invoice.tenantId, tenantId);
      await cancelInvoice(storeInvoiceRepository, id);
      cancelInvoiceInStore(id);
      recordAudit({ action: 'update', entity: 'invoice', entityId: id, tenantId, userId });
    },
    [cancelInvoiceInStore, getInvoiceById, tenantId, userId]
  );

  const remove = useCallback(
    async (id: string) => {
      const invoice = getInvoiceById(id);
      if (invoice) ensureAuthorizedTenant(invoice.tenantId, tenantId);
      const deleted = await deleteDraftInvoice(storeInvoiceRepository, id);
      if (deleted) {
        deleteInvoiceFromStore(id);
        recordAudit({ action: 'delete', entity: 'invoice', entityId: id, tenantId, userId });
      }
      return deleted;
    },
    [deleteInvoiceFromStore, getInvoiceById, tenantId, userId]
  );

  return {
    // Data
    invoices: scopedInvoices,
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
