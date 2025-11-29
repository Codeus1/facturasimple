"use client"

import * as React from "react"
import { cn } from "@/src/lib/utils"

// ============================================================================
// SIMPLE SELECT - Native HTML select with styling
// Mantiene compatibilidad con código existente que usa <option>
// ============================================================================

export interface SimpleSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const SimpleSelect = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
SimpleSelect.displayName = "SimpleSelect"

export { SimpleSelect }
