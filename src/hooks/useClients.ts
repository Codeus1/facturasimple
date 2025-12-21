/**
 * Custom Hook: useClients
 * Encapsulates all client-related operations
 */

import { useMemo, useCallback } from 'react';
import { useAppStore, selectClients } from '@/store';
import type { Client, ClientCreateInput } from '@/types';
import { useAuth } from './useAuth';
import { recordAudit } from '@/services/auditTrail';
import { ensureAuthorizedTenant } from '@/lib/security/authorization';

export function useClients() {
  const clients = useAppStore(selectClients);
  const addClient = useAppStore(state => state.addClient);
  const updateClient = useAppStore(state => state.updateClient);
  const deleteClientAction = useAppStore(state => state.deleteClient);
  const rawGetClientById = useAppStore(state => state.getClientById);
  const { tenantId, userId } = useAuth();
  const getClientById = useCallback(
    (id: string) => {
      const client = rawGetClientById(id);
      if (client?.tenantId !== tenantId) return undefined;
      return client;
    },
    [rawGetClientById, tenantId]
  );

  const sortedClients = useMemo(
    () => clients.filter(c => c.tenantId === tenantId).sort((a, b) => a.name.localeCompare(b.name)),
    [clients, tenantId]
  );

  const searchClients = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return sortedClients.filter(
        c =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.nif.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery)
      );
    },
    [sortedClients]
  );

  const createClient = useCallback(
    (data: ClientCreateInput): Client => {
      const payload: ClientCreateInput = {
        ...data,
        tenantId,
        ownerId: userId,
      };
      const client = addClient(payload);
      recordAudit({ action: 'create', entity: 'client', entityId: client.id, tenantId, userId });
      return client;
    },
    [addClient, tenantId, userId]
  );

  const saveClient = useCallback(
    async (client: Client) => {
      const scopedClient: Client = {
        ...client,
        tenantId: client.tenantId || tenantId,
        ownerId: client.ownerId || userId,
        createdAt: client.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      ensureAuthorizedTenant(scopedClient.tenantId, tenantId);
      const exists = clients.some(c => c.id === client.id && c.tenantId === tenantId);
      if (exists) {
        updateClient(scopedClient);
      } else {
        addClient(scopedClient);
      }
      recordAudit({ action: exists ? 'update' : 'create', entity: 'client', entityId: client.id, tenantId, userId });
    },
    [clients, addClient, updateClient, tenantId, userId]
  );

  const deleteClientSafe = useCallback(
    async (id: string) => {
      const existing = clients.find(c => c.id === id);
      if (existing) {
        ensureAuthorizedTenant(existing.tenantId, tenantId);
      }
      deleteClientAction(id);
      recordAudit({ action: 'delete', entity: 'client', entityId: id, tenantId, userId });
    },
    [clients, deleteClientAction, tenantId, userId]
  );

  return {
    clients: sortedClients,
    sortedClients,
    searchClients,
    createClient,
    saveClient,
    updateClient,
    deleteClient: deleteClientSafe,
    getClientById,
    clientCount: sortedClients.length,
  };
}
