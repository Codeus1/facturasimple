/**
 * Domain Types - Core business entities
 * Following Single Responsibility: Each type represents one domain concept
 */

// ============================================================================
// CLIENT DOMAIN
// ============================================================================

export interface Client {
  readonly id: string;
  name: string;
  nif: string;
  address: string;
  email: string;
  tenantId: string;
  ownerId: string;
  readonly createdAt: number;
  readonly updatedAt?: number;
}

export type ClientCreateInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type ClientUpdateInput = Partial<ClientCreateInput> & { id: string };

// ============================================================================
// INVOICE DOMAIN
// ============================================================================

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export interface InvoiceItem {
  readonly id: string;
  description: string;
  quantity: number;
  priceUnit: number;
  subtotal: number;
}

export interface Invoice {
  readonly id: string;
  invoiceNumber: string;
  series: string;
  fiscalYear: number;
  sequence: number;
  clientId: string;
  clientName?: string; // Denormalized for list views
  issueDate: number;
  dueDate: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  taxesIncluded?: boolean; // Si true, los precios incluyen impuestos
  baseTotal: number;
  vatRate: number;
  vatAmount: number;
  irpfRate: number;
  irpfAmount: number;
  totalAmount: number;
  createdAt: number;
  updatedAt: number;
  statusChangedAt?: number;
}

export type InvoiceCreateInput = Omit<
  Invoice,
  'id' | 'invoiceNumber' | 'sequence' | 'createdAt' | 'updatedAt' | 'statusChangedAt' | 'fiscalYear'
> & {
  id?: string;
  invoiceNumber?: string;
  sequence?: number;
  fiscalYear?: number;
  createdAt?: number;
  updatedAt?: number;
  statusChangedAt?: number;
};

// ============================================================================
// DASHBOARD / KPI
// ============================================================================

export interface KPIStats {
  incomeMonth: number;
  pendingAmount: number;
  overdueCount: number;
}

// ============================================================================
// UI / APP STATE
// ============================================================================

export type Theme = 'light' | 'dark';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Result type for operations that can fail */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/** Make specific keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific keys required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
