# Copilot Instructions - FacturaSimple B2B

## Project Architecture

This is a **Next.js 16** application with **App Router** for B2B invoice management. Key technologies:
- **React 19** with TypeScript
- **Zustand** for state management with localStorage persistence
- **React Hook Form + Zod** for form validation
- **shadcn/ui** components (Radix primitives + Tailwind)
- **jsPDF + jspdf-autotable** for PDF generation
- **PapaParse** for CSV import/export

## Project Structure (Next.js App Router Colocation)

```
src/
├── app/                        # Next.js App Router (pages colocated)
│   ├── page.tsx                # Dashboard (/) - includes internal components
│   ├── layout.tsx              # Root layout
│   ├── clients/
│   │   └── page.tsx            # Clients page with internal components
│   ├── dashboard/
│   │   └── page.tsx            # Redirect to /
│   └── invoices/
│       ├── page.tsx            # Invoices list with internal components
│       ├── _components/        # Private components (underscore = not routable)
│       │   └── ImportDialog.tsx
│       └── [id]/
│           └── page.tsx        # Invoice detail (dynamic route)
├── components/                 # Shared UI components
│   ├── ui/                     # shadcn/ui primitives (Button, Card, etc.)
│   ├── PageHeader.tsx          # Reusable page header
│   ├── PageLoading.tsx         # Loading state component
│   ├── EmptyState.tsx          # Empty table state
│   └── ConfirmDialog.tsx       # Reusable confirmation dialog
├── hooks/                      # Custom hooks (useInvoices, useClients, etc.)
├── services/                   # Business logic (PDF, CSV, etc.)
├── store/                      # Zustand store with persistence
├── constants/                  # App constants (routes, rates, etc.)
└── types/                      # TypeScript types
```

## Next.js App Router Conventions

- **Colocation**: Page components and their internal components live in `page.tsx`
- **Private folders**: Use `_components/` prefix for route-private components
- **Dynamic routes**: Use `[param]/` folder naming
- **Layouts**: Use `layout.tsx` for shared layouts
- **Loading**: Use `loading.tsx` for suspense boundaries

## Key Patterns

### Component Organization (SRP)
- Pages decomposed into smaller components (e.g., `InvoicesTable`, `InvoiceRow`, `StatusFilter`)
- Each component has single responsibility
- Internal components at bottom of file with clear separation

### State Management
```typescript
// Use selectors for performance
const invoices = useAppStore(selectInvoices);
const { save, remove, cancel } = useInvoices();
```

### Forms with Zod + React Hook Form
```typescript
const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
});
const form = useForm({ resolver: zodResolver(schema) });
```

### Reusable Components
```tsx
<PageHeader 
  title="Facturas" 
  description="Historial" 
  actions={<Button>Nueva</Button>} 
/>
<EmptyState message="No hay datos" colSpan={4} />
<ConfirmDialog variant="destructive" title="Eliminar" onConfirm={fn} />
```

## Invoice Business Rules

1. **Draft invoices** (`DRAFT`) can be deleted
2. **Emitted invoices** (PENDING, PAID, OVERDUE) can only be **cancelled** (`CANCELLED`)
3. Cancelled invoices remain in system (legal requirement in Spain)
4. Invoice numbers are auto-generated: `FAC-YYYY-NNNN`

## Development Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint check
```

## Code Conventions

- Spanish for user-facing text, English for code
- Use barrel exports (`index.ts`) for clean imports
- Constants in `src/constants/index.ts` (avoid magic numbers)
- Types in `src/types/index.ts`
- Services are pure functions, no side effects

## Common Tasks

### Adding a new page
1. Create route in `src/app/[route]/page.tsx`
2. Create feature component in `src/features/[feature]/`
3. Use `PageHeader`, `PageLoading`, `EmptyState` from components

### Adding invoice functionality
1. Add action to store in `src/store/index.ts`
2. Expose through `useInvoices` hook
3. Update `InvoicesPage` or create new component
