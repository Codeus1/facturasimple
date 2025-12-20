/**
 * CSV Exporter Service
 * Exports invoice data to CSV format
 */

import type { Invoice } from '@/types';

// ============================================================================
// CSV HELPER
// ============================================================================

function escapeCsvField(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ============================================================================
// INVOICE CSV EXPORT
// ============================================================================

export function exportInvoicesToCSV(invoices: Invoice[]): void {
  if (!invoices.length) {
    alert('No hay facturas para exportar.');
    return;
  }

  const headers = [
    'Número',
    'Fecha Emisión',
    'Fecha Vencimiento',
    'Cliente',
    'Estado',
    'Base Imponible',
    'IVA',
    'IRPF',
    'Total',
  ];

  const rows = invoices.map(inv => [
    escapeCsvField(inv.invoiceNumber),
    new Date(inv.issueDate).toLocaleDateString('es-ES'),
    new Date(inv.dueDate).toLocaleDateString('es-ES'),
    escapeCsvField(inv.clientName || 'Desconocido'),
    inv.status,
    inv.baseTotal.toFixed(2),
    inv.vatAmount.toFixed(2),
    inv.irpfAmount.toFixed(2),
    inv.totalAmount.toFixed(2),
  ]);

  // Combine with BOM for Excel UTF-8 compatibility
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `facturas_export_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
