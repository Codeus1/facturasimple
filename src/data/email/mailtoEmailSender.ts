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

  const mailtoUrl = `mailto:${encodeURIComponent(message.to)}?${params.toString()}`;
  window.open(mailtoUrl, '_blank');
}

export class MailtoEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    openMailto(message);
  }
}

export const mailtoEmailSender = new MailtoEmailSender();
