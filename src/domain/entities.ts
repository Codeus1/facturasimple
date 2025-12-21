/**
 * Domain entities and validation schemas.
 * Keep schemas as the single source of truth to validate persisted or imported data.
 */
import { z } from 'zod';

const DEFAULT_TENANT = 'public';
const SYSTEM_USER = 'system';

export const clientSchema = z.object({
  id: z.string().min(1, 'Client id is required'),
  name: z.string().min(1, 'Client name is required'),
  nif: z.string().min(3, 'NIF is too short'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Email no válido'),
  tenantId: z.string().min(1).default(DEFAULT_TENANT),
  ownerId: z.string().min(1).default(SYSTEM_USER),
  createdAt: z.number().int().nonnegative().default(() => Date.now()),
  updatedAt: z.number().int().nonnegative().optional(),
});

export type ClientEntity = z.infer<typeof clientSchema>;

export const invoiceItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  priceUnit: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

export const invoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().min(1),
  clientId: z.string().min(1),
  clientName: z.string().optional(),
  issueDate: z.number().int(),
  dueDate: z.number().int(),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  items: z.array(invoiceItemSchema).min(1),
  taxesIncluded: z.boolean().optional(),
  baseTotal: z.number(),
  vatRate: z.number(),
  vatAmount: z.number(),
  irpfRate: z.number(),
  irpfAmount: z.number(),
  totalAmount: z.number(),
  tenantId: z.string().min(1).default(DEFAULT_TENANT),
  ownerId: z.string().min(1).default(SYSTEM_USER),
  createdAt: z.number().int().nonnegative().default(() => Date.now()),
  updatedAt: z.number().int().nonnegative().optional(),
});

export type InvoiceEntity = z.infer<typeof invoiceSchema>;

// Helper to validate arbitrary payloads coming from storage/CSV/API.
export function parseInvoice(payload: unknown): InvoiceEntity {
  return invoiceSchema.parse(payload);
}

export function parseClient(payload: unknown): ClientEntity {
  return clientSchema.parse(payload);
}
