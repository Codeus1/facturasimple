/**
 * CSV Importer Service
 * Imports invoice data from CSV format using PapaParse
 */

import Papa from 'papaparse';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/src/types';
import { generateId } from '@/src/lib/utils';
import { DEFAULT_DUE_DATE_OFFSET_MS } from '@/src/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  invoices: Invoice[];
}

export interface ImportOptions {
  /** Mapeo de clientes por nombre -> clientId */
  clientMap: Map<string, string>;
  /** Números de factura ya existentes en el sistema */
  existingInvoiceNumbers: Set<string>;
  /** Si true, omite duplicados silenciosamente. Si false, los reporta como error */
  skipDuplicates?: boolean;
}

interface CsvRow {
  [key: string]: string | undefined;
}

// ============================================================================
// PARSING HELPERS
// ============================================================================

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
}

function findColumn(headers: string[], ...patterns: string[]): string | null {
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return header; // Retorna el header ORIGINAL (con acentos)
      }
    }
  }
  return null;
}

function parseDate(dateStr: string | undefined): number {
  if (!dateStr?.trim()) return Date.now();

  const cleaned = dateStr.trim();

  // Formatos comunes
  const formats = [
    // dd/mm/yyyy o dd-mm-yyyy
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // yyyy-mm-dd
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
  ];

  for (const regex of formats) {
    const match = cleaned.match(regex);
    if (match) {
      if (match[1].length === 4) {
        // yyyy-mm-dd
        return new Date(+match[1], +match[2] - 1, +match[3]).getTime();
      } else {
        // dd/mm/yyyy
        return new Date(+match[3], +match[2] - 1, +match[1]).getTime();
      }
    }
  }

  // Fallback
  const parsed = Date.parse(cleaned);
  return isNaN(parsed) ? Date.now() : parsed;
}

function parseStatus(statusStr: string | undefined): InvoiceStatus | null {
  if (!statusStr) return 'DRAFT';

  const normalized = statusStr.toUpperCase().trim();

  const statusMap: Record<string, InvoiceStatus> = {
    DRAFT: 'DRAFT',
    BORRADOR: 'DRAFT',
    PENDING: 'PENDING',
    PENDIENTE: 'PENDING',
    PAID: 'PAID',
    PAGADA: 'PAID',
    PAGADO: 'PAID',
    OVERDUE: 'OVERDUE',
    VENCIDA: 'OVERDUE',
    VENCIDO: 'OVERDUE',
    CANCELLED: 'CANCELLED',
    ANULADA: 'CANCELLED',
    ANULADO: 'CANCELLED',
  };

  return statusMap[normalized] || null; // null si no es válido
}

function parseNumber(value: string | undefined): number {
  if (!value?.trim()) return 0;

  let cleaned = value.replace(/[€$£\s]/g, '').trim();

  // Detectar formato europeo vs americano
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Formato europeo: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Solo coma - decimal europeo
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// ============================================================================
// MAIN IMPORTER
// ============================================================================

export function parseInvoicesFromCSV(
  csvContent: string,
  options: ImportOptions
): ImportResult {
  const errors: string[] = [];
  const invoices: Invoice[] = [];
  let skippedCount = 0;

  // Parsear CSV con PapaParse
  // Quitar BOM si existe
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  
  const parseResult = Papa.parse<CsvRow>(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  // Reportar errores de parsing
  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((err) => {
      if (err.type !== 'FieldMismatch') {
        errors.push(`Error CSV línea ${(err.row ?? 0) + 2}: ${err.message}`);
      }
    });
  }

  const data = parseResult.data;
  const headers = parseResult.meta.fields || [];

  if (data.length === 0) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['El archivo CSV está vacío o solo tiene encabezados'],
      invoices: [],
    };
  }

  // Detectar columnas automáticamente
  const cols = {
    numero: findColumn(headers, 'numero', 'number', 'nº', 'num', 'factura'),
    fechaEmision: findColumn(headers, 'emision', 'fecha', 'issue', 'date'),
    fechaVencimiento: findColumn(headers, 'venc', 'due'),
    cliente: findColumn(headers, 'cliente', 'client', 'customer', 'nombre'),
    estado: findColumn(headers, 'estado', 'status'),
    base: findColumn(headers, 'base', 'subtotal', 'neto', 'imponible'),
    iva: findColumn(headers, 'iva', 'vat', 'tax'),
    irpf: findColumn(headers, 'irpf', 'retencion', 'withholding'),
    total: findColumn(headers, 'total', 'importe', 'amount'),
    concepto: findColumn(headers, 'concepto', 'descripcion', 'description', 'detalle'),
  };

  // Validar columnas mínimas
  if (!cols.numero && !cols.cliente) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [
        'No se encontraron columnas requeridas. Se esperan al menos: Número y Cliente. ' +
        `Columnas encontradas: ${headers.join(', ')}`
      ],
      invoices: [],
    };
  }

  // Set para detectar duplicados dentro del CSV
  const seenInvoiceNumbers = new Set<string>();

  // Procesar filas
  data.forEach((row, index) => {
    const lineNum = index + 2; // +2: índice 0-based + header

    try {
      const invoiceNumber = cols.numero ? row[cols.numero]?.trim() : '';

      // Validar número de factura
      if (!invoiceNumber) {
        errors.push(`Línea ${lineNum}: Número de factura vacío`);
        return;
      }

      // Verificar si ya existe en el sistema
      if (options.existingInvoiceNumbers.has(invoiceNumber)) {
        if (options.skipDuplicates) {
          skippedCount++;
        } else {
          errors.push(`Línea ${lineNum}: La factura "${invoiceNumber}" ya existe en el sistema`);
        }
        return;
      }

      // Verificar duplicados en el CSV
      if (seenInvoiceNumbers.has(invoiceNumber)) {
        errors.push(`Línea ${lineNum}: Factura "${invoiceNumber}" duplicada en el archivo`);
        return;
      }
      seenInvoiceNumbers.add(invoiceNumber);

      // Buscar cliente
      const clientName = cols.cliente ? row[cols.cliente]?.trim() : '';
      const clientId = clientName
        ? options.clientMap.get(clientName.toLowerCase())
        : '';

      if (!clientId && clientName) {
        errors.push(`Línea ${lineNum}: Cliente "${clientName}" no encontrado en el sistema`);
        return;
      }

      // Parsear valores numéricos
      const baseTotal = parseNumber(cols.base ? row[cols.base] : undefined);
      const vatAmount = parseNumber(cols.iva ? row[cols.iva] : undefined);
      const irpfAmount = parseNumber(cols.irpf ? row[cols.irpf] : undefined);
      const csvTotal = parseNumber(cols.total ? row[cols.total] : undefined);

      // ========== VALIDACIONES DE DATOS ==========
      
      // Validar base imponible positiva
      if (baseTotal <= 0) {
        errors.push(`Línea ${lineNum}: Base imponible debe ser mayor que 0`);
        return;
      }

      // Validar IVA no negativo
      if (vatAmount < 0) {
        errors.push(`Línea ${lineNum}: IVA no puede ser negativo (${vatAmount}€)`);
        return;
      }

      // Validar IRPF no negativo
      if (irpfAmount < 0) {
        errors.push(`Línea ${lineNum}: IRPF no puede ser negativo (${irpfAmount}€)`);
        return;
      }

      // Validar estado
      const statusRaw = cols.estado ? row[cols.estado]?.trim() : '';
      const status = parseStatus(statusRaw);
      if (statusRaw && status === null) {
        errors.push(`Línea ${lineNum}: Estado "${statusRaw}" no válido. Use: Borrador, Pendiente, Pagada, Vencida`);
        return;
      }

      // Validar fechas
      const issueDate = parseDate(cols.fechaEmision ? row[cols.fechaEmision] : undefined);
      const dueDate = parseDate(cols.fechaVencimiento ? row[cols.fechaVencimiento] : undefined) ||
                      (issueDate + DEFAULT_DUE_DATE_OFFSET_MS);
      
      if (dueDate < issueDate) {
        errors.push(`Línea ${lineNum}: Fecha de vencimiento anterior a fecha de emisión`);
        return;
      }

      // Calcular y validar totales
      const calculatedTotal = baseTotal + vatAmount - irpfAmount;
      const totalAmount = csvTotal > 0 ? csvTotal : calculatedTotal;

      if (csvTotal > 0 && Math.abs(calculatedTotal - csvTotal) > 1) {
        errors.push(
          `Línea ${lineNum}: Total (${csvTotal.toFixed(2)}€) no coincide con Base+IVA-IRPF (${calculatedTotal.toFixed(2)}€)`
        );
        return;
      }

      // Calcular tasas
      const vatRate =
        baseTotal > 0 ? Math.round((vatAmount / baseTotal) * 100) / 100 : 0.21;
      const irpfRate =
        baseTotal > 0 ? Math.round((irpfAmount / baseTotal) * 100) / 100 : 0;

      // Crear item
      const description = cols.concepto
        ? row[cols.concepto]?.trim()
        : 'Concepto importado';
      const items: InvoiceItem[] = [
        {
          id: generateId(),
          description: description || 'Concepto importado',
          quantity: 1,
          priceUnit: baseTotal,
          subtotal: baseTotal,
        },
      ];

      // Crear factura
      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber,
        clientId: clientId || '',
        clientName: clientName || '',
        issueDate,
        dueDate,
        status: status || 'DRAFT',
        items,
        baseTotal,
        vatRate,
        vatAmount,
        irpfRate,
        irpfAmount,
        totalAmount,
      };

      invoices.push(invoice);
    } catch (err) {
      errors.push(
        `Línea ${lineNum}: Error - ${err instanceof Error ? err.message : 'Error desconocido'}`
      );
    }
  });

  return {
    success: invoices.length > 0 || (skippedCount > 0 && errors.length === 0),
    imported: invoices.length,
    skipped: skippedCount,
    errors,
    invoices,
  };
}

// ============================================================================
// FILE READER
// ============================================================================

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file, 'UTF-8');
  });
}
