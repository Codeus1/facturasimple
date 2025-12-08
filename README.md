# FacturaSimple B2B
## factura
Sistema de facturación profesional para autónomos y pequeñas empresas. Construido con React, TypeScript y principios de arquitectura escalable.

## 🚀 Características

- ✅ **Gestión de Clientes**: CRUD completo con búsqueda
- ✅ **Facturación**: Crear, editar, emitir y marcar como pagadas
- ✅ **Cálculos Automáticos**: IVA (21%, 10%, 4%, Exento) e IRPF (15%)
- ✅ **Exportación**: PDF profesional y CSV para Excel
- ✅ **Dashboard**: KPIs en tiempo real
- ✅ **Tema Claro/Oscuro**: Preferencias persistentes
- ✅ **Responsive**: Diseñado para móvil y escritorio

## 🏗️ Arquitectura

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (Button, Card, Input...)
│   └── index.ts        # Barrel exports
├── features/           # Páginas y lógica por dominio
│   ├── dashboard/
│   ├── clients/
│   └── invoices/
├── hooks/              # Custom hooks
├── store/              # Estado global (Zustand)
├── services/           # Servicios externos (PDF, CSV)
├── schemas/            # Validación (Zod)
├── types/              # TypeScript interfaces
├── constants/          # Configuración y constantes
├── lib/                # Utilidades
└── styles/             # CSS global
```

## 🎯 Principios Aplicados

### SOLID
- **S**ingle Responsibility: Cada componente/hook hace una sola cosa
- **O**pen/Closed: Componentes extensibles via props
- **L**iskov Substitution: Interfaces consistentes
- **I**nterface Segregation: Tipos específicos por dominio
- **D**ependency Inversion: Hooks abstraen el acceso a datos

### KISS (Keep It Simple)
- Router simple basado en pathname
- Estado centralizado en un solo store
- Componentes sin lógica de negocio compleja

### DRY (Don't Repeat Yourself)
- Hooks reutilizables (`useClients`, `useInvoices`, `useNavigation`)
- Componentes UI compartidos
- Funciones de utilidad centralizadas

### YAGNI (You Aren't Gonna Need It)
- Sin over-engineering: sin Redux, sin React Query (localStorage es suficiente)
- Sin abstracción prematura
- Código que resuelve problemas reales

## 🛠️ Tecnologías

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Zustand** - State Management
- **React Hook Form** - Form Handling
- **Zod** - Schema Validation
- **Tailwind CSS** - Styling
- **Vite** - Build Tool
- **jsPDF** - PDF Generation

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

## 📁 Estructura de Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/store/index.ts` | Estado global de la aplicación |
| `src/hooks/index.ts` | Custom hooks para acceso a datos |
| `src/schemas/index.ts` | Validación de formularios |
| `src/constants/index.ts` | Configuración centralizada |
| `src/lib/utils.ts` | Funciones de utilidad |

## 🔧 Configuración

### Variables de Entorno

No se requieren variables de entorno. Los datos se persisten en localStorage.

### Datos del Emisor

Edita `src/constants/index.ts`:

```typescript
export const ISSUER_INFO = {
  name: 'Tu Empresa S.L.',
  nif: 'B-12345678',
  address: 'Tu dirección',
  email: 'email@empresa.com',
};
```

## 📝 Licencia

MIT
