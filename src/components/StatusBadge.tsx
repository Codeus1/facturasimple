import React from 'react';
import type { InvoiceStatus } from '@/src/types';
import { INVOICE_STATUS } from '@/src/types';

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const statusStyles: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  [INVOICE_STATUS.PENDING]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  [INVOICE_STATUS.PAID]: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  [INVOICE_STATUS.OVERDUE]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: 'Borrador',
  [INVOICE_STATUS.PENDING]: 'Pendiente',
  [INVOICE_STATUS.PAID]: 'Pagada',
  [INVOICE_STATUS.OVERDUE]: 'Vencida',
};

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]} ${className}`}
    >
      {statusLabels[status]}
    </span>
  );
};
