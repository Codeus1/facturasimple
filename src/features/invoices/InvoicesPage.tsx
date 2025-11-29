"use client";

import React, { useState } from 'react';
import { Plus, Download, Filter, Eye, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { useInvoices, useNavigation, useMounted } from '@/src/hooks';
import { ROUTES } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { exportInvoicesToCSV, generateInvoicePDF } from '@/src/services';
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
import { StatusBadge, Link } from '@/src/components';
import type { InvoiceStatus } from '@/src/types';

// ============================================================================
// INVOICES LIST PAGE
// ============================================================================

export const InvoicesPage: React.FC = () => {
  const mounted = useMounted();
  const { sortedInvoices, filterByStatus, markAsPaid, getClientById } = useInvoices();
  const { goToNewInvoice } = useNavigation();
  
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturas</h1>
          <p className="text-muted-foreground">Historial completo de facturación</p>
        </div>
        <div className="flex gap-2">
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
    </div>
  );
};

export default InvoicesPage;

