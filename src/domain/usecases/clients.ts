/**
 * Client use cases on repository contracts.
 */
import { parseClient, type ClientEntity } from '../entities';
import type { ClientRepository } from '../repositories';

export async function saveClient(
  repo: ClientRepository,
  client: ClientEntity
): Promise<void> {
  const validated = parseClient(client);
  await repo.save(validated);
}

export async function deleteClient(
  repo: ClientRepository,
  id: string
): Promise<void> {
  await repo.delete(id);
}
