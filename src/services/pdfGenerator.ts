/**
 * PDF Generator Service
 * Generates professional invoice PDFs
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Client } from '@/src/types';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { ISSUER_INFO } from '@/src/constants';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BRAND_COLOR: [number, number, number] = [14, 165, 233]; // Tailwind Sky-500
const TEXT_COLOR = 40;

// ============================================================================
// PDF GENERATOR
// ============================================================================

export function generateInvoicePDF(invoice: Invoice, client: Client): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(TEXT_COLOR);
  doc.text('FACTURA', 14, 22);

  // Meta Data
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Nº: ${invoice.invoiceNumber}`, 14, 28);
  doc.text(`Fecha: ${formatDate(invoice.issueDate)}`, 14, 33);

  // Status Stamp
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  if (invoice.status === 'PAID') {
    doc.setTextColor(22, 163, 74); // Green
    doc.text('PAGADA', 160, 22);
  } else if (invoice.status === 'PENDING') {
    doc.setTextColor(37, 99, 235); // Blue
    doc.text('PENDIENTE', 160, 22);
  }

  // Parties Section
  const startY = 50;

  // Issuer
  doc.setTextColor(TEXT_COLOR);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DE:', 14, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(ISSUER_INFO.name, 14, startY + 5);
  doc.text(ISSUER_INFO.nif, 14, startY + 10);
  doc.text(ISSUER_INFO.address, 14, startY + 15);

  // Client
  doc.setFont('helvetica', 'bold');
  doc.text('PARA:', 120, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, 120, startY + 5);
  doc.text(client.nif, 120, startY + 10);
  doc.text(client.address || '', 120, startY + 15);

  // Table
  const tableColumn = ['Concepto', 'Cant.', 'Precio', 'Total'];
  const tableRows = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.priceUnit),
    formatCurrency(item.subtotal),
  ]);

  // Handle both ESM and CJS module formats
  const runAutoTable = (autoTable as any).default || autoTable;

  if (typeof runAutoTable === 'function') {
    runAutoTable(doc, {
      startY: startY + 30,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  // Totals Section
  let finalY = (doc as any).lastAutoTable?.finalY || startY + 40;
  finalY += 10;

  const rightColX = 140;
  const valueColX = 195;

  doc.setFontSize(10);
  doc.setTextColor(TEXT_COLOR);

  // Base
  doc.text('Base Imponible:', rightColX, finalY);
  doc.text(formatCurrency(invoice.baseTotal), valueColX, finalY, { align: 'right' });

  // VAT
  finalY += 6;
  doc.text(`IVA (${(invoice.vatRate * 100).toFixed(0)}%):`, rightColX, finalY);
  doc.text(formatCurrency(invoice.vatAmount), valueColX, finalY, { align: 'right' });

  // IRPF
  if (invoice.irpfRate > 0) {
    finalY += 6;
    doc.text(`IRPF (${(invoice.irpfRate * 100).toFixed(0)}%):`, rightColX, finalY);
    doc.text(`-${formatCurrency(invoice.irpfAmount)}`, valueColX, finalY, { align: 'right' });
  }

  // Final Total
  finalY += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', rightColX, finalY);
  doc.text(formatCurrency(invoice.totalAmount), valueColX, finalY, { align: 'right' });

  // Save
  doc.save(`Factura_${invoice.invoiceNumber}.pdf`);
}
