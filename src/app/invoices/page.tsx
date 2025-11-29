"use client";

import React, { useState, useRef } from 'react';
import { Plus, Download, Filter, Eye, CheckCircle, FileSpreadsheet, Upload, Trash2, Ban } from 'lucide-react';
import { useInvoices, useNavigation, useMounted } from '@/src/hooks';
import { ROUTES } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { exportInvoicesToCSV, generateInvoicePDF, parseInvoicesFromCSV, readFileAsText } from '@/src/services';
import type { ImportResult } from '@/src/services';
import type { Invoice, InvoiceStatus } from '@/src/types';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SimpleSelect,
} from '@/src/components/ui';
import { 
  StatusBadge, 
  Link, 
  PageHeader, 
  PageLoading, 
  EmptyState, 
  ConfirmDialog 
} from '@/src/components';
import { ImportDialog } from './_components/ImportDialog';

// ============================================================================
// INVOICES LIST PAGE
// ============================================================================

export default function InvoicesPage() {
  const mounted = useMounted();
  const { sortedInvoices, filterByStatus, markAsPaid, getClientById, clients, saveInvoice, remove, cancel } = useInvoices();
  const { goToNewInvoice } = useNavigation();
  
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!mounted) {
    return <PageLoading message="Cargando facturas..." />;
  }

  const filteredInvoices = filterByStatus(statusFilter);

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
      const content = await readFileAsText(file);
      
      const clientMap = new Map<string, string>();
      clients.forEach(c => clientMap.set(c.name.toLowerCase(), c.id));

      const existingInvoiceNumbers = new Set<string>(
        sortedInvoices.map(inv => inv.invoiceNumber)
      );

      const result = parseInvoicesFromCSV(content, { 
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

  // ========== RENDER ==========

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
            <Button variant="outline" icon={Upload} onClick={handleImportClick} isLoading={isImporting}>
              Importar
            </Button>
            <Button variant="outline" icon={FileSpreadsheet} onClick={handleExport}>
              Exportar
            </Button>
            <Button icon={Plus} onClick={goToNewInvoice}>
              Nueva Factura
            </Button>
          </>
        }
      />

      <Card>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <InvoicesTable
          invoices={filteredInvoices}
          onMarkPaid={handleMarkPaid}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onCancel={handleCancel}
        />
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

interface StatusFilterProps {
  value: InvoiceStatus | 'ALL';
  onChange: (status: InvoiceStatus | 'ALL') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => (
  <div className="p-4 border-b border-border flex items-center gap-4">
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Filter size={16} /> Estado
    </div>
    <SimpleSelect
      value={value}
      onChange={e => onChange(e.target.value as InvoiceStatus | 'ALL')}
      className="w-40"
    >
      <option value="ALL">Todos</option>
      <option value="DRAFT">Borrador</option>
      <option value="PENDING">Pendiente</option>
      <option value="PAID">Pagada</option>
      <option value="OVERDUE">Vencida</option>
      <option value="CANCELLED">Anulada</option>
    </SimpleSelect>
  </div>
);

interface InvoicesTableProps {
  invoices: Invoice[];
  onMarkPaid: (e: React.MouseEvent, id: string) => void;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onCancel: (e: React.MouseEvent, id: string) => void;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onMarkPaid,
  onDownload,
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
        <EmptyState message="No hay facturas" colSpan={6} />
      ) : (
        invoices.map(inv => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            onMarkPaid={onMarkPaid}
            onDownload={onDownload}
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
  onMarkPaid: (e: React.MouseEvent, id: string) => void;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onCancel: (e: React.MouseEvent, id: string) => void;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({ 
  invoice: inv, 
  onMarkPaid, 
  onDownload, 
  onDelete, 
  onCancel 
}) => (
  <TableRow className="group hover:bg-muted/50">
    <TableCell className="font-mono text-muted-foreground">
      <Link href={ROUTES.INVOICE_DETAIL(inv.id)} className="hover:underline">
        {inv.invoiceNumber}
      </Link>
    </TableCell>
    <TableCell className="text-muted-foreground">
      {formatDate(inv.issueDate)}
    </TableCell>
    <TableCell className="font-medium">{inv.clientName}</TableCell>
    <TableCell className="font-bold">{formatCurrency(inv.totalAmount)}</TableCell>
    <TableCell>
      <StatusBadge status={inv.status} />
    </TableCell>
    <TableCell className="text-right">
      <InvoiceActions
        invoice={inv}
        onMarkPaid={onMarkPaid}
        onDownload={onDownload}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    </TableCell>
  </TableRow>
);

const InvoiceActions: React.FC<InvoiceRowProps> = ({ 
  invoice: inv, 
  onMarkPaid, 
  onDownload, 
  onDelete, 
  onCancel 
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
    
    <Button
      variant="ghost"
      size="icon"
      title="Descargar PDF"
      onClick={e => onDownload(e, inv.id)}
    >
      <Download size={18} />
    </Button>
    
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
