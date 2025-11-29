/**
 * Repository contracts so UI can swap persistence (localStorage, API, DB).
 * Keep methods minimal to encourage composable use cases.
 */
import type { ClientEntity, InvoiceEntity } from './entities';

export interface ClientRepository {
  list(): Promise<ClientEntity[]>;
  getById(id: string): Promise<ClientEntity | undefined>;
  save(client: ClientEntity): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface InvoiceRepository {
  list(): Promise<InvoiceEntity[]>;
  getById(id: string): Promise<InvoiceEntity | undefined>;
  save(invoice: InvoiceEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
