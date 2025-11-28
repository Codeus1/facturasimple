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
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Client, Invoice, InvoiceStatus, Theme, KPIStats } from '@/src/types';
import { APP_CONFIG, ROUTES } from '@/src/constants';
import { generateId, generateInvoiceNumber, updateById, removeById } from '@/src/lib/utils';

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
  deleteInvoice: (id: string) => void;
  
  // Selectors (computed)
  getNextInvoiceNumber: () => string;
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
          ...clientData,
          id: generateId(),
          createdAt: Date.now(),
        };
        set(state => ({
          clients: [...state.clients, client],
        }));
        return client;
      },

      updateClient: (client) => {
        set(state => ({
          clients: updateById(state.clients, client),
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
          if (exists) {
            return { invoices: updateById(state.invoices, invoice) };
          }
          return { invoices: [...state.invoices, invoice] };
        });
      },

      createInvoice: (invoiceData) => {
        const invoice: Invoice = {
          ...invoiceData,
          id: generateId(),
        };
        set(state => ({
          invoices: [...state.invoices, invoice],
        }));
        return invoice;
      },

      updateInvoiceStatus: (id, status) => {
        set(state => ({
          invoices: state.invoices.map(inv =>
            inv.id === id ? { ...inv, status } : inv
          ),
        }));
      },

      deleteInvoice: (id) => {
        set(state => ({
          invoices: removeById(state.invoices, id),
        }));
      },

      // ------------------------------------------------------------------
      // SELECTORS (Computed values - not persisted)
      // ------------------------------------------------------------------
      getNextInvoiceNumber: () => {
        const { invoices } = get();
        const numbers = invoices.map(i => i.invoiceNumber);
        return generateInvoiceNumber(numbers);
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
      storage: createJSONStorage(() => localStorage),
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
