import { z } from 'zod';
import { DEFAULT_FISCAL_SERIES, MAX_PAYMENT_TERM_DAYS } from '@/constants';
import { getFiscalYearFromDate, isPaymentTermValid, parseInvoiceNumber } from '@/lib/utils';

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'El nombre es obligatorio (mín. 2 caracteres)'),
  nif: z.string().min(5, 'El NIF debe tener al menos 5 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional().default(''),
  createdAt: z.number().optional(),
});

export type ClientFormData = z.infer<typeof ClientSchema>;

// ============================================================================
// INVOICE SCHEMAS
// ============================================================================

export const InvoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.number().min(0.01, 'Cantidad mínima: 0.01'),
  priceUnit: z.number().min(0, 'El precio debe ser positivo'),
  subtotal: z.number(),
});

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Número de factura requerido'),
  series: z.string().min(1).optional().default(DEFAULT_FISCAL_SERIES),
  fiscalYear: z.number().int().optional(),
  sequence: z.number().int().optional(),
  clientId: z.string().min(1, 'Debes seleccionar un cliente'),
  issueDate: z.number(),
  dueDate: z.number(),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  items: z
    .array(InvoiceItemSchema)
    .min(1, 'Añade al menos un concepto'),
  taxesIncluded: z.boolean().optional().default(false), // IVA/IRPF incluido en precios
  baseTotal: z.number(),
  vatRate: z.number().min(0).max(1),
  vatAmount: z.number(),
  irpfRate: z.number().min(0).max(1),
  irpfAmount: z.number(),
  totalAmount: z.number(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  statusChangedAt: z.number().optional(),
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

  const parsed = parseInvoiceNumber(data.invoiceNumber, data.series);
  const fiscalYear = data.fiscalYear ?? getFiscalYearFromDate(data.issueDate);
  if (parsed && parsed.fiscalYear !== fiscalYear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['invoiceNumber'],
      message: 'La serie/año de la factura debe coincidir con la fecha de emisión',
    });
  }
});

export type InvoiceFormData = z.infer<typeof InvoiceSchema>;
export type InvoiceItemFormData = z.infer<typeof InvoiceItemSchema>;

// ============================================================================
// SCHEMA UTILITIES
// ============================================================================

export function validateClient(data: unknown) {
  return ClientSchema.safeParse(data);
}

export function validateInvoice(data: unknown) {
  return InvoiceSchema.safeParse(data);
}
