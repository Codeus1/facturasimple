import React from 'react';
import { cn } from '@/src/lib/utils';

// ============================================================================
// LABEL COMPONENT
// ============================================================================

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        'text-foreground mb-2 block',
        className
      )}
      {...props}
    />
  )
);

Label.displayName = 'Label';

export { Label };
