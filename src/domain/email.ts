/**
 * Email domain contracts.
 * The UI should depend on this interface, not on specific transport.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
