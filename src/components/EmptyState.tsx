import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

interface EmptyStateProps {
  message: string;
  colSpan?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, colSpan = 1 }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">
      {message}
    </TableCell>
  </TableRow>
);
