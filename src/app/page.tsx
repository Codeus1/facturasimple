'use client';

import { EmptyState, Link, PageHeader, PageLoading, StatusBadge } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTES } from '@/constants';
import { useAuth, useMounted, useInvoices } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';
import { AlertTriangle, ArrowRight, Clock, Euro } from 'lucide-react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// DASHBOARD PAGE (Home)
// ============================================================================

export default function DashboardPage() {
  const mounted = useMounted();
  const { invoices } = useInvoices();
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (!mounted || loading) {
    return <PageLoading message="Cargando datos..." />;
  }

  const stats = calculateDashboardStats(invoices);
  const recentInvoices = [...invoices].sort((a, b) => b.issueDate - a.issueDate).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader title="Dashboard" description="Resumen de actividad reciente" />

      <StatsGrid stats={stats} />

      <RecentActivityCard invoices={recentInvoices} />
    </div>
  );
}

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, subtext }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon size={20} />
      </div>
    </CardContent>
  </Card>
);

interface StatsGridProps {
  stats: {
    incomeMonth: number;
    pendingAmount: number;
    overdueCount: number;
  };
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <StatCard
      title="Ingresos (Mes)"
      value={formatCurrency(stats.incomeMonth)}
      icon={Euro}
      colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      subtext="Facturas cobradas"
    />
    <StatCard
      title="Pendiente"
      value={formatCurrency(stats.pendingAmount)}
      icon={Clock}
      colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      subtext="Por cobrar"
    />
    <StatCard
      title="Vencidas"
      value={stats.overdueCount}
      icon={AlertTriangle}
      colorClass="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      subtext="Facturas retrasadas"
    />
  </div>
);

interface RecentActivityCardProps {
  invoices: Invoice[];
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ invoices }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-xl">Actividad Reciente</CardTitle>
      <Link
        href={ROUTES.INVOICES}
        className="text-sm font-medium hover:underline flex items-center"
      >
        Ver todas <ArrowRight size={16} className="ml-1" />
      </Link>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <EmptyState message="No hay facturas recientes" colSpan={4} />
          ) : (
            invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell>
                  <Link href={ROUTES.INVOICE_DETAIL(inv.id)} className="font-mono hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>{inv.clientName}</TableCell>
                <TableCell className="font-bold">{formatCurrency(inv.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

function calculateDashboardStats(invoices: Invoice[]) {
  const now = Date.now();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return invoices.reduce(
    (acc, inv) => {
      const invDate = new Date(inv.issueDate);
      const invMonth = invDate.getMonth();
      const invYear = invDate.getFullYear();

      if (inv.status === 'PAID' && invMonth === currentMonth && invYear === currentYear) {
        acc.incomeMonth += inv.totalAmount;
      }
      if (inv.status === 'PENDING') {
        acc.pendingAmount += inv.totalAmount;
      }
      if ((inv.status === 'PENDING' || inv.status === 'OVERDUE') && inv.dueDate < now) {
        acc.overdueCount++;
      }
      return acc;
    },
    { incomeMonth: 0, pendingAmount: 0, overdueCount: 0 }
  );
}
