'use client';

import {
  ConfirmDialog,
  EmptyState,
  Link,
  PageHeader,
  PageLoading,
  StatusBadge,
} from '@/components';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SimpleSelect } from '@/components/ui/simple-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTES } from '@/constants';
import type { InvoiceSearchFilters } from '@/hooks';
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  useDebounce,
  useInvoices,
  useInvoiceSearch,
  useMounted,
  useNavigation,
} from '@/hooks';
import { formatCurrency, formatDate, formatDateForInput } from '@/lib/utils';
import type { ImportResult } from '@/services';
import {
  canSendEmail,
  exportInvoicesToCSV,
  generateInvoicePDF,
  parseInvoicesFromCSV,
  sendInvoiceEmail,
} from '@/services';
import type { Invoice, InvoiceStatus } from '@/types';
import {
  Ban,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Mail,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImportDialog } from './_components/ImportDialog';

// ============================================================================
// INVOICES LIST PAGE
// ============================================================================

export default function InvoicesPage() {
  const mounted = useMounted();
  const { sortedInvoices, markAsPaid, getClientById, clients, saveInvoice, remove, cancel } =
    useInvoices();
  const { goToNewInvoice } = useNavigation();

  // Search & Filter State
  const [filters, setFilters] = useState<InvoiceSearchFilters>(DEFAULT_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const debouncedQuery = useDebounce(filters.query, 300);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Apply debounced search
  const searchFilters = { ...filters, query: debouncedQuery };
  const filteredInvoices = useInvoiceSearch(sortedInvoices, searchFilters);

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedQuery,
    filters.status,
    filters.clientId,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
  ]);

  // Dialog States
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter update helper
  const updateFilter = useCallback(
    <K extends keyof InvoiceSearchFilters>(key: K, value: InvoiceSearchFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  if (!mounted) {
    return <PageLoading message="Cargando facturas..." />;
  }

  // ========== HANDLERS ==========

  const handleDownload = (e: React.MouseEvent, invoiceId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const invoice = sortedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const client = getClientById(invoice.clientId);
    if (client) {
      generateInvoicePDF(invoice, client);
    }
  };

  const handleSendEmail = (e: React.MouseEvent, invoiceId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const invoice = sortedInvoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const client = getClientById(invoice.clientId);
    if (!client) return;

    // First download PDF, then open email
    generateInvoicePDF(invoice, client);

    try {
      sendInvoiceEmail({ invoice, client });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleMarkPaid = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    markAsPaid(id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const handleCancel = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCancelConfirm(id);
  };

  const handleExport = () => exportInvoicesToCSV(filteredInvoices);
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const clientMap = new Map<string, string>();
      clients.forEach(c => clientMap.set(c.name.toLowerCase(), c.id));

      const existingInvoiceNumbers = new Set<string>(sortedInvoices.map(inv => inv.invoiceNumber));

      const result = await parseInvoicesFromCSV(file, {
        clientMap,
        existingInvoiceNumbers,
        skipDuplicates: false,
      });
      setImportResult(result);
      setImportDialogOpen(true);
    } catch (err) {
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Error al procesar el archivo'],
        invoices: [],
      });
      setImportDialogOpen(true);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    importResult?.invoices.forEach((invoice: Invoice) => saveInvoice(invoice));
    setImportDialogOpen(false);
    setImportResult(null);
  };

  const handleCancelImport = () => {
    setImportDialogOpen(false);
    setImportResult(null);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      remove(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const confirmCancel = () => {
    if (cancelConfirm) {
      cancel(cancelConfirm);
      setCancelConfirm(null);
    }
  };

  const activeFilterCount = countActiveFilters(searchFilters);

  // ========== RENDER ==========
  // todo: por que cuando he creado una factura para un cliente nuevo recien creado
  // me ha salido una numeracion rara?: 2025-0112? ha habido como un salto, eso estaria bien?
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Facturas"
        description="Historial completo de facturación"
        actions={
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importando...' : 'Importar'}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <FileSpreadsheet className="h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={goToNewInvoice}>
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Button>
          </>
        }
      />

      <Card>
        {/* Search & Filter Bar */}
        <SearchFilterBar
          filters={filters}
          clients={clients}
          showAdvanced={showAdvancedFilters}
          activeFilterCount={activeFilterCount}
          onUpdateFilter={updateFilter}
          onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          onClear={clearFilters}
        />

        <InvoicesTable
          invoices={paginatedInvoices}
          getClientById={getClientById}
          onMarkPaid={handleMarkPaid}
          onDownload={handleDownload}
          onSendEmail={handleSendEmail}
          onDelete={handleDelete}
          onCancel={handleCancel}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} de{' '}
              {filteredInvoices.length} facturas
            </div>

            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                <PaginationItem>
                  <span className="text-sm font-medium px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        result={importResult}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Eliminar Borrador"
        description="¿Estás seguro de que quieres eliminar este borrador? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!cancelConfirm}
        onOpenChange={() => setCancelConfirm(null)}
        title="Anular Factura"
        description="¿Estás seguro de que quieres anular esta factura? La factura quedará marcada como anulada pero no se eliminará del sistema (requisito legal)."
        confirmText="Anular Factura"
        variant="warning"
        onConfirm={confirmCancel}
      />
    </div>
  );
}

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

interface SearchFilterBarProps {
  filters: InvoiceSearchFilters;
  clients: { id: string; name: string }[];
  showAdvanced: boolean;
  activeFilterCount: number;
  onUpdateFilter: <K extends keyof InvoiceSearchFilters>(
    key: K,
    value: InvoiceSearchFilters[K]
  ) => void;
  onToggleAdvanced: () => void;
  onClear: () => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  clients,
  showAdvanced,
  activeFilterCount,
  onUpdateFilter,
  onToggleAdvanced,
  onClear,
}) => (
  <div className="border-b border-border">
    {/* Main Search Row */}
    <div className="p-4 flex flex-wrap items-center gap-4">
      {/* Text Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          type="text"
          placeholder="Buscar por número o cliente..."
          value={filters.query}
          onChange={e => onUpdateFilter('query', e.target.value)}
          className="pl-9 pr-9"
        />
        {filters.query && (
          <button
            onClick={() => onUpdateFilter('query', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-muted-foreground" />
        <SimpleSelect
          value={filters.status}
          onChange={e => onUpdateFilter('status', e.target.value as InvoiceStatus | 'ALL')}
          className="w-36"
        >
          <option value="ALL">Todos</option>
          <option value="DRAFT">Borrador</option>
          <option value="PENDING">Pendiente</option>
          <option value="PAID">Pagada</option>
          <option value="OVERDUE">Vencida</option>
          <option value="CANCELLED">Anulada</option>
        </SimpleSelect>
      </div>

      {/* Advanced Filters Toggle */}
      <Button variant="outline" size="sm" onClick={onToggleAdvanced} className="relative">
        <Filter size={14} className="mr-1" />
        Más filtros
        {activeFilterCount > 0 && (
          <span className="ml-1.5 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X size={14} className="mr-1" /> Limpiar
        </Button>
      )}
    </div>

    {/* Advanced Filters Panel */}
    {showAdvanced && (
      <div className="px-4 pb-4 pt-2 bg-muted/30 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">Cliente</Label>
          <SimpleSelect
            value={filters.clientId}
            onChange={e => onUpdateFilter('clientId', e.target.value)}
          >
            <option value="ALL">Todos los clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SimpleSelect>
        </div>

        {/* Date From */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} /> Desde
          </Label>
          <Input
            type="date"
            value={filters.dateFrom ? formatDateForInput(filters.dateFrom) : ''}
            onChange={e =>
              onUpdateFilter('dateFrom', e.target.value ? new Date(e.target.value).getTime() : null)
            }
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} /> Hasta
          </Label>
          <Input
            type="date"
            value={filters.dateTo ? formatDateForInput(filters.dateTo) : ''}
            onChange={e =>
              onUpdateFilter('dateTo', e.target.value ? new Date(e.target.value).getTime() : null)
            }
          />
        </div>

        {/* Amount Range */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign size={12} /> Importe
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={filters.amountMin ?? ''}
              onChange={e =>
                onUpdateFilter('amountMin', e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-24"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={filters.amountMax ?? ''}
              onChange={e =>
                onUpdateFilter('amountMax', e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-24"
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

interface InvoicesTableProps {
  invoices: Invoice[];
  getClientById: (id: string) => { id: string; name: string; email: string } | undefined;
  onMarkPaid: (e: React.MouseEvent, id: string) => void;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onSendEmail: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onCancel: (e: React.MouseEvent, id: string) => void;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  getClientById,
  onMarkPaid,
  onDownload,
  onSendEmail,
  onDelete,
  onCancel,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Número</TableHead>
        <TableHead>Fecha</TableHead>
        <TableHead>Cliente</TableHead>
        <TableHead>Total</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {invoices.length === 0 ? (
        <EmptyState message="No hay facturas que coincidan" colSpan={6} />
      ) : (
        invoices.map(inv => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            client={getClientById(inv.clientId)}
            onMarkPaid={onMarkPaid}
            onDownload={onDownload}
            onSendEmail={onSendEmail}
            onDelete={onDelete}
            onCancel={onCancel}
          />
        ))
      )}
    </TableBody>
  </Table>
);

interface InvoiceRowProps {
  invoice: Invoice;
  client?: { id: string; name: string; email: string };
  onMarkPaid: (e: React.MouseEvent, id: string) => void;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onSendEmail: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onCancel: (e: React.MouseEvent, id: string) => void;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({
  invoice: inv,
  client,
  onMarkPaid,
  onDownload,
  onSendEmail,
  onDelete,
  onCancel,
}) => (
  <TableRow className="group hover:bg-muted/50">
    <TableCell className="font-mono text-muted-foreground">
      <Link href={ROUTES.INVOICE_DETAIL(inv.id)} className="hover:underline">
        {inv.invoiceNumber}
      </Link>
    </TableCell>
    <TableCell className="text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
    <TableCell className="font-medium">{inv.clientName}</TableCell>
    <TableCell className="font-bold">{formatCurrency(inv.totalAmount)}</TableCell>
    <TableCell>
      <StatusBadge status={inv.status} />
    </TableCell>
    <TableCell className="text-right">
      <InvoiceActions
        invoice={inv}
        canEmail={canSendEmail(client)}
        onMarkPaid={onMarkPaid}
        onDownload={onDownload}
        onSendEmail={onSendEmail}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    </TableCell>
  </TableRow>
);

interface InvoiceActionsProps {
  invoice: Invoice;
  canEmail: boolean;
  onMarkPaid: (e: React.MouseEvent, id: string) => void;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onSendEmail: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onCancel: (e: React.MouseEvent, id: string) => void;
}

const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  invoice: inv,
  canEmail,
  onMarkPaid,
  onDownload,
  onSendEmail,
  onDelete,
  onCancel,
}) => (
  <div className="flex justify-end gap-1">
    {inv.status === 'PENDING' && (
      <Button
        variant="ghost"
        size="icon"
        title="Marcar como pagada"
        className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
        onClick={e => onMarkPaid(e, inv.id)}
      >
        <CheckCircle size={18} />
      </Button>
    )}

    <Button variant="ghost" size="icon" title="Descargar PDF" onClick={e => onDownload(e, inv.id)}>
      <Download size={18} />
    </Button>

    {/* Email Button - only show if client has email */}
    {canEmail && inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && (
      <Button
        variant="ghost"
        size="icon"
        title="Enviar por email"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        onClick={e => onSendEmail(e, inv.id)}
      >
        <Mail size={18} />
      </Button>
    )}

    <Link href={ROUTES.INVOICE_DETAIL(inv.id)}>
      <Button variant="ghost" size="icon" title="Ver detalle">
        <Eye size={18} />
      </Button>
    </Link>

    {inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && (
      <Button
        variant="ghost"
        size="icon"
        title="Anular factura"
        className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        onClick={e => onCancel(e, inv.id)}
      >
        <Ban size={18} />
      </Button>
    )}

    {inv.status === 'DRAFT' && (
      <Button
        variant="ghost"
        size="icon"
        title="Eliminar borrador"
        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
        onClick={e => onDelete(e, inv.id)}
      >
        <Trash2 size={18} />
      </Button>
    )}
  </div>
);
