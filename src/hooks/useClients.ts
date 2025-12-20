/**
 * Custom Hook: useClients
 * Encapsulates all client-related operations
 */

import { useMemo, useCallback } from 'react';
import { useAppStore, selectClients } from '@/store';
import type { Client, ClientCreateInput } from '@/types';

export function useClients() {
  const clients = useAppStore(selectClients);
  const addClient = useAppStore(state => state.addClient);
  const updateClient = useAppStore(state => state.updateClient);
  const deleteClientAction = useAppStore(state => state.deleteClient);
  const getClientById = useAppStore(state => state.getClientById);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients]
  );

  const searchClients = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return clients.filter(
        c =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.nif.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery)
      );
    },
    [clients]
  );

  const createClient = useCallback(
    (data: ClientCreateInput): Client => {
      return addClient(data);
    },
    [addClient]
  );

  const saveClient = useCallback(
    async (client: Client) => {
      const exists = clients.some(c => c.id === client.id);
      if (exists) {
        updateClient(client);
      } else {
        addClient(client);
      }
    },
    [clients, addClient, updateClient]
  );

  const deleteClientSafe = useCallback(
    async (id: string) => {
      deleteClientAction(id);
    },
    [deleteClientAction]
  );

  return {
    clients,
    sortedClients,
    searchClients,
    createClient,
    saveClient,
    updateClient,
    deleteClient: deleteClientSafe,
    getClientById,
    clientCount: clients.length,
  };
}
