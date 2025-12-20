/**
 * Client repository backed by the Zustand store.
 * This keeps current behaviour while allowing the UI to depend on an interface.
 */
import type { ClientRepository } from '@/domain/repositories';
import type { ClientEntity } from '@/domain/entities';
import { parseClient } from '@/domain/entities';
import { useAppStore } from '@/store';

export const storeClientRepository: ClientRepository = {
  async list(): Promise<ClientEntity[]> {
    return useAppStore.getState().clients.map(parseClient);
  },

  async getById(id: string): Promise<ClientEntity | undefined> {
    const client = useAppStore.getState().clients.find(c => c.id === id);
    return client ? parseClient(client) : undefined;
  },

  async save(client: ClientEntity): Promise<void> {
    const { clients } = useAppStore.getState();
    const exists = clients.some(c => c.id === client.id);
    if (exists) {
      useAppStore.setState({
        clients: clients.map(c => (c.id === client.id ? client : c)),
      });
    } else {
      useAppStore.setState({ clients: [...clients, client] });
    }
  },

  async delete(id: string): Promise<void> {
    const { clients } = useAppStore.getState();
    useAppStore.setState({
      clients: clients.filter(c => c.id !== id),
    });
  },
};
