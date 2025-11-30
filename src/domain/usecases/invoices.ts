/**
 * Invoice use cases operating on repository contracts.
 * Keeps domain logic out of UI components.
 */
import type { InvoiceStatus } from '@/src/types';
import type { InvoiceRepository } from '../repositories';
import type { InvoiceEntity } from '../entities';
import { parseInvoice } from '../entities';

export async function saveInvoice(
  repo: InvoiceRepository,
  invoice: InvoiceEntity
): Promise<void> {
  const validated = parseInvoice(invoice);
  await repo.save(validated);
}

export async function setInvoiceStatus(
  repo: InvoiceRepository,
  id: string,
  status: InvoiceStatus
): Promise<void> {
  const existing = await repo.getById(id);
  if (!existing) return;
  await repo.save({ ...existing, status });
}

export async function cancelInvoice(
  repo: InvoiceRepository,
  id: string
): Promise<void> {
  await setInvoiceStatus(repo, id, 'CANCELLED');
}

export async function deleteDraftInvoice(
  repo: InvoiceRepository,
  id: string
): Promise<boolean> {
  const existing = await repo.getById(id);
  if (!existing || existing.status !== 'DRAFT') {
    return false;
  }
  await repo.delete(id);
  return true;
}
