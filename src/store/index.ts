/**
 * Zustand Store - State Management
 * 
 * Architecture:
 * - Single store with clear separation of concerns
 * - Computed values via selectors (not stored state)
 * - Actions grouped by domain
 * - Persisted to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, Invoice, InvoiceStatus, Theme, KPIStats } from '@/types';
import { APP_CONFIG, DEFAULT_FISCAL_SERIES, ROUTES } from '@/constants';
import {
  generateId,
  generateInvoiceNumber,
  getFiscalYearFromDate,
  updateById,
  removeById,
} from '@/lib/utils';
import { validatedStorage } from '@/data/persistence/storage';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AppState {
  // UI State
  theme: Theme;
  currentPath: string;
  
  // Domain Data
  clients: Client[];
  invoices: Invoice[];
}

interface AppActions {
  // Theme
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  
  // Navigation
  navigate: (path: string) => void;
  
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  
  // Invoices
  saveInvoice: (invoice: Invoice) => void;
  createInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  cancelInvoice: (id: string) => void;
  deleteInvoice: (id: string) => boolean; // Returns false if invoice is not a draft
  
  // Selectors (computed)
  getNextInvoiceNumber: (issueDate?: number) => string;
  getClientById: (id: string) => Client | undefined;
  getInvoiceById: (id: string) => Invoice | undefined;
  getDashboardStats: () => KPIStats;
}

type AppStore = AppState & AppActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const getInitialPath = (): string => {
  if (typeof window === 'undefined') return ROUTES.DASHBOARD;
  const path = window.location.pathname;
  return path === '/' ? ROUTES.DASHBOARD : path;
};

const initialState: AppState = {
  theme: 'light',
  currentPath: getInitialPath(),
  clients: [],
  invoices: [],
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ------------------------------------------------------------------
      // THEME ACTIONS
      // ------------------------------------------------------------------
      toggleTheme: () => {
        set(state => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      // ------------------------------------------------------------------
      // NAVIGATION ACTIONS
      // ------------------------------------------------------------------
      navigate: (path) => {
        try {
          window.history.pushState({}, '', path);
        } catch {
          // Ignore errors in sandboxed environments
        }
        set({ currentPath: path });
      },

      // ------------------------------------------------------------------
      // CLIENT ACTIONS
      // ------------------------------------------------------------------
      addClient: (clientData) => {
        const client: Client = {
          tenantId: clientData.tenantId,
          ownerId: clientData.ownerId,
          ...clientData,
          id: generateId(),
          createdAt: clientData.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({
          clients: [...state.clients, client],
        }));
        return client;
      },

      updateClient: (client) => {
        set(state => ({
          clients: updateById(state.clients, { ...client, updatedAt: Date.now() }),
        }));
      },

      deleteClient: (id) => {
        set(state => ({
          clients: removeById(state.clients, id),
        }));
      },

      // ------------------------------------------------------------------
      // INVOICE ACTIONS
      // ------------------------------------------------------------------
      saveInvoice: (invoice) => {
        set(state => {
          const exists = state.invoices.some(i => i.id === invoice.id);
          const now = Date.now();
          if (exists) {
            const current = state.invoices.find(i => i.id === invoice.id)!;
            if (current.status !== 'DRAFT') {
              return { invoices: state.invoices };
            }
            const stamped: Invoice = {
              ...invoice,
              series: invoice.series ?? current.series ?? DEFAULT_FISCAL_SERIES,
              fiscalYear:
                invoice.fiscalYear ?? current.fiscalYear ?? getFiscalYearFromDate(invoice.issueDate ?? Date.now()),
              sequence: invoice.sequence ?? current.sequence,
              createdAt: current.createdAt ?? invoice.createdAt ?? now,
              updatedAt: now,
              statusChangedAt:
                invoice.status !== current.status ? now : current.statusChangedAt ?? invoice.statusChangedAt,
            };
            return { invoices: updateById(state.invoices, stamped) };
          }
          const created: Invoice = {
            ...invoice,
            series: invoice.series ?? DEFAULT_FISCAL_SERIES,
            fiscalYear: invoice.fiscalYear ?? getFiscalYearFromDate(invoice.issueDate ?? now),
            sequence: invoice.sequence ?? 0,
            createdAt: invoice.createdAt ?? now,
            updatedAt: now,
            statusChangedAt: invoice.statusChangedAt ?? (invoice.status !== 'DRAFT' ? now : undefined),
          };
          return { invoices: [...state.invoices, created] };
        });
      },

      createInvoice: (invoiceData) => {
        const now = Date.now();
        const fiscalYear = getFiscalYearFromDate(invoiceData.issueDate ?? now);
        const series = invoiceData.series ?? DEFAULT_FISCAL_SERIES;
        const existingNumbers = get()
          .invoices.filter(inv => (inv.series || DEFAULT_FISCAL_SERIES) === series)
          .map(inv => inv.invoiceNumber);
        const { invoiceNumber, sequence } = generateInvoiceNumber(existingNumbers, series, fiscalYear);
        const invoice: Invoice = {
          ...invoiceData,
          id: generateId(),
          series,
          fiscalYear,
          sequence,
          invoiceNumber,
          createdAt: now,
          updatedAt: now,
          statusChangedAt: invoiceData.status !== 'DRAFT' ? now : undefined,
        };
        set(state => ({
          invoices: [...state.invoices, invoice],
        }));
        return invoice;
      },

      updateInvoiceStatus: (id, status) => {
        set(state => ({
          invoices: state.invoices.map(inv =>
            inv.id === id
              ? {
                  ...inv,
                  status,
                  updatedAt: Date.now(),
                  statusChangedAt: inv.status !== status ? Date.now() : inv.statusChangedAt,
                }
              : inv
          ),
        }));
      },

      cancelInvoice: (id) => {
        set(state => ({
          invoices: state.invoices.map(inv =>
            inv.id === id
              ? {
                  ...inv,
                  status: 'CANCELLED' as InvoiceStatus,
                  updatedAt: Date.now(),
                  statusChangedAt: inv.status !== 'CANCELLED' ? Date.now() : inv.statusChangedAt,
                }
              : inv
          ),
        }));
      },

      deleteInvoice: (id) => {
        const invoice = get().invoices.find(inv => inv.id === id);
        // Solo permitir borrar borradores
        if (!invoice || invoice.status !== 'DRAFT') {
          return false;
        }
        set(state => ({
          invoices: removeById(state.invoices, id),
        }));
        return true;
      },

      // ------------------------------------------------------------------
      // SELECTORS (Computed values - not persisted)
      // ------------------------------------------------------------------
      getNextInvoiceNumber: (issueDate) => {
        const { invoices } = get();
        const fiscalYear = getFiscalYearFromDate(issueDate ?? Date.now());
        const numbers = invoices
          .filter(inv => (inv.series || DEFAULT_FISCAL_SERIES) === DEFAULT_FISCAL_SERIES)
          .map(i => i.invoiceNumber);
        return generateInvoiceNumber(numbers, DEFAULT_FISCAL_SERIES, fiscalYear).invoiceNumber;
      },

      getClientById: (id) => {
        return get().clients.find(c => c.id === id);
      },

      getInvoiceById: (id) => {
        return get().invoices.find(i => i.id === id);
      },

      getDashboardStats: () => {
        const { invoices } = get();
        const now = Date.now();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const initialStats: KPIStats = { incomeMonth: 0, pendingAmount: 0, overdueCount: 0 };
        
        return invoices.reduce(
          (acc, inv) => {
            const invDate = new Date(inv.issueDate);
            const invMonth = invDate.getMonth();
            const invYear = invDate.getFullYear();

            // Monthly income (paid invoices this month)
            if (inv.status === 'PAID' && invMonth === currentMonth && invYear === currentYear) {
              acc.incomeMonth += inv.totalAmount;
            }

            // Pending amount
            if (inv.status === 'PENDING') {
              acc.pendingAmount += inv.totalAmount;
            }

            // Overdue count
            if ((inv.status === 'PENDING' || inv.status === 'OVERDUE') && inv.dueDate < now) {
              acc.overdueCount++;
            }

            return acc;
          },
          initialStats
        );
      },
    }),
    {
      name: APP_CONFIG.storageKey,
      storage: validatedStorage,
      // Only persist data, not navigation state
      partialize: (state) => ({
        theme: state.theme,
        clients: state.clients,
        invoices: state.invoices,
      }),
    }
  )
);

// ============================================================================
// TYPED SELECTORS (for better performance with shallow comparison)
// ============================================================================

export const selectTheme = (state: AppStore) => state.theme;
export const selectCurrentPath = (state: AppStore) => state.currentPath;
export const selectClients = (state: AppStore) => state.clients;
export const selectInvoices = (state: AppStore) => state.invoices;
export const selectNavigate = (state: AppStore) => state.navigate;
