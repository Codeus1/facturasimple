# Copilot Instructions - FacturaSimple B2B

## Project Architecture

**Next.js 16** application with **App Router** for B2B invoice management (Spain-compliant).

**Stack:**
- React 19 + TypeScript
- Zustand (state + localStorage persistence)
- React Hook Form + Zod (validation)
- shadcn/ui (11 components: alert-dialog, badge, button, card, dialog, form, input, label, simple-select, spinner, table)
- jsPDF + jspdf-autotable (PDF generation)
- PapaParse (CSV import/export)

## Project Structure

```
src/
├── app/                        # Next.js App Router (colocated pages)
│   ├── page.tsx                # Dashboard (/)
│   ├── layout.tsx              # Root layout with AppLayout
│   ├── clients/page.tsx        # Clients CRUD
│   ├── dashboard/page.tsx      # Redirect to /
│   └── invoices/
│       ├── page.tsx            # Invoices list + import dialog
│       └── [id]/page.tsx       # Invoice form (new/edit)
├── components/                 # Shared components
│   ├── ui/                     # shadcn/ui primitives (minimal set)
│   ├── AppLayout.tsx           # Navigation + theme toggle
│   ├── ClientForm.tsx          # Client form component
│   ├── ConfirmDialog.tsx       # Reusable confirmation dialog
│   ├── EmptyState.tsx          # Empty table state
│   ├── Link.tsx                # Next.js Link wrapper
│   ├── PageHeader.tsx          # Page header with actions
│   ├── PageLoading.tsx         # Loading spinner
│   └── StatusBadge.tsx         # Invoice status badge
├── hooks/                      # Custom hooks
│   ├── useClients.ts           # Client operations
│   ├── useInvoices.ts          # Invoice operations
│   ├── useMounted.ts           # Hydration guard
│   ├── useNavigation.ts        # Router helpers
│   └── useTheme.ts             # Theme toggle
├── services/                   # Pure business logic
│   ├── csvExporter.ts          # Export invoices to CSV
│   ├── csvImporter.ts          # Import invoices from CSV
│   └── pdfGenerator.ts         # Generate invoice PDF
├── store/index.ts              # Zustand store with persistence
├── schemas/index.ts            # Zod validation schemas
├── constants/index.ts          # App constants (VAT rates, routes)
├── types/index.ts              # TypeScript interfaces
└── lib/utils.ts                # Utility functions
```

## Key Patterns

### State (Zustand + Hooks)
```typescript
const { invoices, saveInvoice, removeInvoice, cancelInvoice } = useInvoices();
const { clients, saveClient, removeClient } = useClients();
```

### Forms (React Hook Form + Zod)
```typescript
const form = useForm<InvoiceFormData>({
  resolver: zodResolver(InvoiceSchema),
  defaultValues: { status: 'DRAFT', items: [{ ... }] }
});
```

### Hydration Guard
```typescript
const mounted = useMounted();
if (!mounted) return <PageLoading />;
```

## Invoice Business Rules

1. **DRAFT** → can be deleted or edited
2. **PENDING/PAID/OVERDUE** → can only be cancelled (Spain legal requirement)
3. **CANCELLED** → immutable, remains in system
4. Invoice numbers: `FAC-YYYY-NNNN` (auto-generated)

## Commands

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

## Conventions

- Spanish UI text, English code
- Barrel exports (`index.ts`) for clean imports
- No magic numbers (use constants)
- Services = pure functions, no side effects
- Components follow SRP (Single Responsibility)
