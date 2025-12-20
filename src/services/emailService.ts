/**
 * Email Service
 * Handles sending invoices via email using mailto: protocol
 * 
 * Single Responsibility: Only handles email composition and sending
 * Open/Closed: Can be extended with new email providers without modifying core logic
 */

import type { Invoice, Client } from '@/types';
import type { EmailSender, EmailMessage } from '@/domain/email';
import { mailtoEmailSender } from '@/data/email/mailtoEmailSender';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ISSUER_INFO } from '@/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceEmailData {
  invoice: Invoice;
  client: Client;
  customMessage?: string;
}

// Re-exported for compatibility with the previous API surface
export type EmailOptions = EmailMessage;

// ============================================================================
// EMAIL BODY GENERATOR (Template Method Pattern)
// ============================================================================

function generateInvoiceEmailBody(data: InvoiceEmailData): string {
  const { invoice, client, customMessage } = data;
  
  const lines = [
    `Estimado/a ${client.name},`,
    '',
    customMessage || 'Le adjuntamos la factura correspondiente a los servicios prestados.',
    '',
    '─────────────────────────────',
    `📄 FACTURA: ${invoice.invoiceNumber}`,
    '─────────────────────────────',
    '',
    `📅 Fecha de emisión: ${formatDate(invoice.issueDate)}`,
    `📅 Fecha de vencimiento: ${formatDate(invoice.dueDate)}`,
    '',
    '💰 DESGLOSE:',
    `   Base imponible: ${formatCurrency(invoice.baseTotal)}`,
    `   IVA (${(invoice.vatRate * 100).toFixed(0)}%): ${formatCurrency(invoice.vatAmount)}`,
  ];

  if (invoice.irpfRate > 0) {
    lines.push(`   IRPF (${(invoice.irpfRate * 100).toFixed(0)}%): -${formatCurrency(invoice.irpfAmount)}`);
  }

  lines.push(
    '',
    `   ══════════════════════`,
    `   TOTAL: ${formatCurrency(invoice.totalAmount)}`,
    '',
    '─────────────────────────────',
    '',
    'Por favor, descargue el PDF adjunto para ver la factura completa.',
    '',
    'Atentamente,',
    ISSUER_INFO.name,
    ISSUER_INFO.nif,
    ISSUER_INFO.address,
  );

  return lines.join('\n');
}

function generateInvoiceEmailSubject(invoice: Invoice): string {
  return `Factura ${invoice.invoiceNumber} - ${ISSUER_INFO.name}`;
}

// ============================================================================
// EMAIL SENDER (Strategy Pattern - can swap implementations)
// ============================================================================
// todo : pero cuando le das clic a la accion de enviar email, descarga el pdf pero no abre el cliente de correo, 
// por que puede ser? debo de usar alguna libreria para poder hacer el servicio real?
/**
 * Opens the user's default email client with a pre-filled email.
 * This is the most reliable cross-platform solution without a backend.
 * 
 * Note: For PDF attachment, the user must manually attach the downloaded PDF.
 * A backend service (SendGrid, AWS SES, etc.) would be needed for automatic attachments.
 */
export function openEmailClient(options: EmailOptions): void {
  mailtoEmailSender.send({
    to: options.to,
    subject: options.subject,
    body: options.body,
    cc: options.cc,
    bcc: options.bcc,
  });
}

/**
 * Sends an invoice email by opening the user's email client.
 * Downloads the PDF first so user can attach it.
 */
export function sendInvoiceEmail(
  data: InvoiceEmailData,
  sender: EmailSender = mailtoEmailSender
): void {
  const { invoice, client } = data;
  
  if (!client.email) {
    throw new Error('El cliente no tiene email configurado');
  }

  const emailOptions = {
    to: client.email,
    subject: generateInvoiceEmailSubject(invoice),
    body: generateInvoiceEmailBody(data),
  };

  void sender.send(emailOptions);
}

/**
 * Validates if a client has a valid email for sending invoices.
 * Uses minimal interface - only needs email property (Interface Segregation)
 */
export function canSendEmail(client: { email?: string } | undefined): boolean {
  if (!client) return false;
  return Boolean(client.email && client.email.includes('@'));
}
