/**
 * Custom Hook: useNavigation
 * Centralized navigation logic with type safety
 */

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/src/constants';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const goToDashboard = useCallback(() => router.push(ROUTES.DASHBOARD), [router]);
  const goToClients = useCallback(() => router.push(ROUTES.CLIENTS), [router]);
  const goToInvoices = useCallback(() => router.push(ROUTES.INVOICES), [router]);
  const goToNewInvoice = useCallback(() => router.push(ROUTES.INVOICE_NEW), [router]);
  const goToInvoice = useCallback((id: string) => router.push(ROUTES.INVOICE_DETAIL(id)), [router]);
  const goBack = useCallback(() => router.back(), [router]);

  const isActive = useCallback(
    (route: string) => {
      if (route === ROUTES.DASHBOARD) {
        return pathname === route || pathname === '/';
      }
      return pathname?.startsWith(route);
    },
    [pathname]
  );

  return {
    currentPath: pathname,
    navigate,
    goToDashboard,
    goToClients,
    goToInvoices,
    goToNewInvoice,
    goToInvoice,
    goBack,
    isActive,
  };
}
