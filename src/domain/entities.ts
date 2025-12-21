/**
 * Domain entities and validation schemas.
 * Keep schemas as the single source of truth to validate persisted or imported data.
 */
import { z } from 'zod';
import { DEFAULT_FISCAL_SERIES, MAX_PAYMENT_TERM_DAYS } from '@/constants';
import { getFiscalYearFromDate, isPaymentTermValid, parseInvoiceNumber } from '@/lib/utils';

export const clientSchema = z.object({
  id: z.string().min(1, 'Client id is required'),
  name: z.string().min(1, 'Client name is required'),
  nif: z.string().min(3, 'NIF is too short'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Email no válido'),
  createdAt: z.number().int().nonnegative(),
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
  series: z.string().min(1).default(DEFAULT_FISCAL_SERIES),
  fiscalYear: z.number().int().min(2000).default(() => getFiscalYearFromDate(Date.now())),
  sequence: z.number().int().nonnegative().default(0),
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
  createdAt: z.number().int().nonnegative().default(() => Date.now()),
  updatedAt: z.number().int().nonnegative().default(() => Date.now()),
  statusChangedAt: z.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
  const now = Date.now();
  if (data.issueDate > now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['issueDate'],
      message: 'La fecha de emisión no puede ser futura',
    });
  }

  if (!isPaymentTermValid(data.issueDate, data.dueDate, MAX_PAYMENT_TERM_DAYS)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dueDate'],
      message: `El vencimiento debe ser posterior a la emisión y no superar ${MAX_PAYMENT_TERM_DAYS} días`,
    });
  }

  const parsedNumber = parseInvoiceNumber(data.invoiceNumber, data.series);
  const fiscalYearFromNumber = parsedNumber?.fiscalYear ?? data.fiscalYear;
  if (fiscalYearFromNumber !== getFiscalYearFromDate(data.issueDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['invoiceNumber'],
      message: 'La numeración debe corresponder al año fiscal de emisión',
    });
  }
});

export type InvoiceEntity = z.infer<typeof invoiceSchema>;

// Helper to validate arbitrary payloads coming from storage/CSV/API.
export function parseInvoice(payload: unknown): InvoiceEntity {
  return invoiceSchema.parse(payload);
}

export function parseClient(payload: unknown): ClientEntity {
  return clientSchema.parse(payload);
}
