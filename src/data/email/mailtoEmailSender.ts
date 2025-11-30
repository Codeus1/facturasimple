/**
 * Email sender that uses the mailto: protocol (client-side only).
 */
import type { EmailSender, EmailMessage } from '@/src/domain/email';

function openMailto(message: EmailMessage): void {
  const params = new URLSearchParams();
  params.set('subject', message.subject);
  params.set('body', message.body);
  if (message.cc) params.set('cc', message.cc);
  if (message.bcc) params.set('bcc', message.bcc);

  const mailtoUrl = `mailto:${message.to}?${params.toString()}`;
  // Use window.location.href instead of window.open to avoid empty tabs ("weird pages")
  window.location.href = mailtoUrl;
}

export class MailtoEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    openMailto(message);
  }
}

export const mailtoEmailSender = new MailtoEmailSender();
