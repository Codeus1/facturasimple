"use client";

import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader } from '@/components/ui/dialog';
import type { ImportResult } from '@/services';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { AlertCircle } from 'lucide-react';
import React from 'react';


// ============================================================================
// TYPES
// ============================================================================

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================================================
// IMPORT DIALOG COMPONENT
// ============================================================================

export const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  result,
  onConfirm,
  onCancel,
}) => {
  const hasImports = result?.success && result.imported > 0;
  const hasErrors = result?.errors && result.errors.length > 0;
  const hasSkipped = result?.skipped && result.skipped > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {result?.success ? 'Importar Facturas' : 'Resultado de Importación'}
          </DialogTitle>
          <DialogDescription>
            {hasImports
              ? `Se encontraron ${result.imported} facturas nuevas para importar.`
              : hasErrors
              ? 'Hay problemas que necesitan tu atención.'
              : 'No se encontraron facturas nuevas para importar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success message */}
          {hasImports && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ <strong>{result.imported}</strong> facturas nuevas listas para importar
              </p>
            </div>
          )}

          {/* Skipped message */}
          {hasSkipped && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ⏭ <strong>{result.skipped}</strong> facturas omitidas (ya existen)
              </p>
            </div>
          )}

          {/* Errors list */}
          {hasErrors && (
            <ErrorsList errors={result.errors} />
          )}

          {/* Info note */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Las facturas con números que ya existen en el sistema 
              serán ignoradas para evitar duplicados.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {hasImports ? 'Cancelar' : 'Cerrar'}
          </Button>
          {hasImports && (
            <Button onClick={onConfirm}>
              Importar {result.imported} Facturas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

const ErrorsList: React.FC<{ errors: string[] }> = ({ errors }) => {
  const MAX_VISIBLE_ERRORS = 10;
  const visibleErrors = errors.slice(0, MAX_VISIBLE_ERRORS);
  const remainingCount = errors.length - MAX_VISIBLE_ERRORS;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" size={16} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Problemas detectados ({errors.length})
          </p>
          <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 max-h-40 overflow-y-auto">
            {visibleErrors.map((err, i) => (
              <li key={i} className="break-words">{err}</li>
            ))}
            {remainingCount > 0 && (
              <li className="italic">...y {remainingCount} más</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
