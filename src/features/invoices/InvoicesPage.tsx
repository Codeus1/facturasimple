"use client";

import React, { useState, useRef } from 'react';
import { Plus, Download, Filter, Eye, CheckCircle, FileSpreadsheet, Upload, AlertCircle } from 'lucide-react';
import { useInvoices, useNavigation, useMounted } from '@/src/hooks';
import { ROUTES } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { exportInvoicesToCSV, generateInvoicePDF, parseInvoicesFromCSV, readFileAsText } from '@/src/services';
import type { ImportResult } from '@/src/services';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui';
import { StatusBadge, Link } from '@/src/components';
import type { InvoiceStatus } from '@/src/types';

// ============================================================================
// INVOICES LIST PAGE
// ============================================================================

export const InvoicesPage: React.FC = () => {
  const mounted = useMounted();
  const { sortedInvoices, filterByStatus, markAsPaid, getClientById, clients, saveInvoice } = useInvoices();
  const { goToNewInvoice } = useNavigation();
  
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!mounted) {
    return <div className="p-8 text-muted-foreground">Cargando facturas...</div>;
  }

  const filteredInvoices = filterByStatus(statusFilter);

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

  const handleExport = () => {
    exportInvoicesToCSV(filteredInvoices);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const content = await readFileAsText(file);
      
      // Crear mapa de clientes por nombre
      const clientMap = new Map<string, string>();
      clients.forEach(c => {
        clientMap.set(c.name.toLowerCase(), c.id);
      });

      // Crear set de números de factura existentes
      const existingInvoiceNumbers = new Set<string>(
        sortedInvoices.map(inv => inv.invoiceNumber)
      );

      const result = parseInvoicesFromCSV(content, { 
        clientMap,
        existingInvoiceNumbers,
        skipDuplicates: false, // Mostrar errores para duplicados
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
      // Reset input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.invoices) {
      importResult.invoices.forEach(invoice => {
        saveInvoice(invoice);
      });
    }
    setImportDialogOpen(false);
    setImportResult(null);
  };

  const handleCancelImport = () => {
    setImportDialogOpen(false);
    setImportResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturas</h1>
          <p className="text-muted-foreground">Historial completo de facturación</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter size={16} /> Estado
          </div>
          <SimpleSelect
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
            className="w-40"
          >
            <option value="ALL">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagada</option>
            <option value="OVERDUE">Vencida</option>
          </SimpleSelect>
        </div>

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
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No hay facturas
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map(inv => (
                <TableRow key={inv.id} className="group hover:bg-muted/50">
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
                    <div className="flex justify-end gap-1">
                      {inv.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                          onClick={e => handleMarkPaid(e, inv.id)}
                        >
                          <CheckCircle size={18} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => handleDownload(e, inv.id)}
                      >
                        <Download size={18} />
                      </Button>
                      <Link href={ROUTES.INVOICE_DETAIL(inv.id)}>
                        <Button variant="ghost" size="icon">
                          <Eye size={18} />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal de Importacion */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {importResult?.success ? 'Importar Facturas' : 'Resultado de Importación'}
            </DialogTitle>
            <DialogDescription>
              {importResult?.success && importResult.imported > 0
                ? `Se encontraron ${importResult.imported} facturas nuevas para importar.`
                : importResult?.errors && importResult.errors.length > 0
                ? 'Hay problemas que necesitan tu atención.'
                : 'No se encontraron facturas nuevas para importar.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importResult?.success && importResult.imported > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ <strong>{importResult.imported}</strong> facturas nuevas listas para importar
                </p>
              </div>
            )}

            {importResult?.skipped && importResult.skipped > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ⏭ <strong>{importResult.skipped}</strong> facturas omitidas (ya existen)
                </p>
              </div>
            )}

            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" size={16} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Problemas detectados ({importResult.errors.length})
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i} className="break-words">{err}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="italic">...y {importResult.errors.length - 10} más</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Las facturas con números que ya existen en el sistema 
                serán ignoradas para evitar duplicados.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelImport}>
              {importResult?.imported && importResult.imported > 0 ? 'Cancelar' : 'Cerrar'}
            </Button>
            {importResult?.success && importResult.imported > 0 && (
              <Button onClick={handleConfirmImport}>
                Importar {importResult.imported} Facturas
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;

