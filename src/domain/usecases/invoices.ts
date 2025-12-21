/**
 * Invoice use cases operating on repository contracts.
 * Keeps domain logic out of UI components.
 */
import type { InvoiceStatus } from '@/types';
import type { InvoiceRepository } from '../repositories';
import type { InvoiceEntity } from '../entities';
import { parseInvoice } from '../entities';
import { DEFAULT_FISCAL_SERIES } from '@/constants';
import { generateInvoiceNumber, getFiscalYearFromDate, parseInvoiceNumber } from '@/lib/utils';

function withAuditStamps(invoice: InvoiceEntity, existing?: InvoiceEntity): InvoiceEntity {
  const now = Date.now();
  const statusChanged =
    invoice.status !== existing?.status && !(invoice.status === 'DRAFT' && !existing);
  return {
    ...invoice,
    createdAt: existing?.createdAt ?? invoice.createdAt ?? now,
    updatedAt: now,
    statusChangedAt: statusChanged ? now : existing?.statusChangedAt,
  };
}

async function assignNumbering(
  repo: InvoiceRepository,
  invoice: InvoiceEntity,
  preferredSeries = DEFAULT_FISCAL_SERIES
): Promise<InvoiceEntity> {
  const existingInvoices = await repo.list();
  const series = invoice.series || preferredSeries;
  const fiscalYear = invoice.fiscalYear ?? getFiscalYearFromDate(invoice.issueDate);

  const matchingNumbers = existingInvoices
    .filter(inv => {
      const parsed = parseInvoiceNumber(inv.invoiceNumber, inv.series || preferredSeries);
      return parsed?.series === series && parsed?.fiscalYear === fiscalYear;
    })
    .map(inv => inv.invoiceNumber);

  const parsedCurrent = parseInvoiceNumber(invoice.invoiceNumber || '', series);
  const shouldGenerate =
    !parsedCurrent ||
    parsedCurrent.series !== series ||
    parsedCurrent.fiscalYear !== fiscalYear ||
    matchingNumbers.includes(invoice.invoiceNumber);

  if (shouldGenerate) {
    const numbering = generateInvoiceNumber(matchingNumbers, series, fiscalYear);
    return { ...invoice, ...numbering };
  }

  return { ...invoice, series, fiscalYear, sequence: parsedCurrent.sequence };
}

export async function saveInvoice(
  repo: InvoiceRepository,
  invoice: InvoiceEntity
): Promise<InvoiceEntity> {
  const validated = parseInvoice(invoice);
  const existing = await repo.getById(validated.id);

  if (existing && existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar o sobrescribir facturas en borrador');
  }

  const numbered = existing
    ? validated
    : await assignNumbering(repo, validated, validated.series || DEFAULT_FISCAL_SERIES);
  const stamped = withAuditStamps(numbered, existing);
  await repo.save(stamped);
  return stamped;
}

export async function createInvoice(
  repo: InvoiceRepository,
  invoice: InvoiceEntity,
  preferredSeries = DEFAULT_FISCAL_SERIES
): Promise<InvoiceEntity> {
  const validated = parseInvoice(invoice);
  const numbered = await assignNumbering(repo, validated, preferredSeries);
  const stamped = withAuditStamps(numbered);
  await repo.save(stamped);
  return stamped;
}

export async function setInvoiceStatus(
  repo: InvoiceRepository,
  id: string,
  status: InvoiceStatus
): Promise<InvoiceEntity | undefined> {
  const existing = await repo.getById(id);
  if (!existing) return;
  const updated = withAuditStamps({ ...existing, status }, existing);
  await repo.save(updated);
  return updated;
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
