/**
 * Invoice repository backed by the Zustand store.
 * Keeps compatibility with current in-memory/localStorage model.
 */
import type { InvoiceRepository } from '@/src/domain/repositories';
import type { InvoiceEntity } from '@/src/domain/entities';
import { parseInvoice } from '@/src/domain/entities';
import { useAppStore } from '@/src/store';

export const storeInvoiceRepository: InvoiceRepository = {
  async list(): Promise<InvoiceEntity[]> {
    return useAppStore.getState().invoices.map(parseInvoice);
  },

  async getById(id: string): Promise<InvoiceEntity | undefined> {
    const invoice = useAppStore.getState().invoices.find(i => i.id === id);
    return invoice ? parseInvoice(invoice) : undefined;
  },

  async save(invoice: InvoiceEntity): Promise<void> {
    const { invoices } = useAppStore.getState();
    const exists = invoices.some(i => i.id === invoice.id);
    if (exists) {
      useAppStore.setState({
        invoices: invoices.map(i => (i.id === invoice.id ? invoice : i)),
      });
    } else {
      useAppStore.setState({ invoices: [...invoices, invoice] });
    }
  },

  async delete(id: string): Promise<void> {
    const { invoices } = useAppStore.getState();
    useAppStore.setState({
      invoices: invoices.filter(i => i.id !== id),
    });
  },
};
