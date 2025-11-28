import React from 'react';
import { X } from 'lucide-react';

// ============================================================================
// DIALOG COMPONENT
// ============================================================================

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
  title,
  description,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-card border border-border text-card-foreground rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            {title && (
              <h3 className="font-semibold text-lg leading-none tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

Dialog.displayName = 'Dialog';

export { Dialog };
