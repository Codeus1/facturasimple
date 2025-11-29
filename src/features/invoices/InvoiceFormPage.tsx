"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Download,
  CheckCircle,
  FileCheck,
  Loader2,
} from "lucide-react";
import { useInvoices, useNavigation, useMounted } from "@/src/hooks";
import { InvoiceSchema, type InvoiceFormData } from "@/src/schemas";
import {
  VAT_RATES,
  IRPF_RATE,
  DEFAULT_VAT_RATE,
  DEFAULT_DUE_DATE_OFFSET_MS,
} from "@/src/constants";
import {
  formatCurrency,
  formatDateForInput,
  generateId,
  calculateInvoiceTotals,
} from "@/src/lib/utils";
import { generateInvoicePDF } from "@/src/services";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SimpleSelect,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Label,
} from "@/src/components/ui";
import { StatusBadge } from "@/src/components";
import type { Invoice } from "@/src/types";

interface InvoiceFormPageProps {
  invoiceId: string;
}

export const InvoiceFormPage: React.FC<InvoiceFormPageProps> = ({
  invoiceId,
}) => {
  const mounted = useMounted();
  const { goToInvoices, goBack } = useNavigation();
  const {
    clients,
    getInvoiceById,
    getNextInvoiceNumber,
    saveInvoice,
    getClientById,
  } = useInvoices();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNew = invoiceId === "new";
  const existingInvoice = isNew ? undefined : getInvoiceById(invoiceId);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      status: "DRAFT",
      items: [{ id: generateId(), description: "", quantity: 1, priceUnit: 0, subtotal: 0 }],
      vatRate: DEFAULT_VAT_RATE,
      irpfRate: 0,
      taxesIncluded: false,
      baseTotal: 0,
      vatAmount: 0,
      irpfAmount: 0,
      totalAmount: 0,
      issueDate: Date.now(),
      dueDate: Date.now() + DEFAULT_DUE_DATE_OFFSET_MS,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!mounted) return;
    if (isNew) {
      form.setValue("invoiceNumber", getNextInvoiceNumber());
    } else if (existingInvoice) {
      form.reset(existingInvoice);
    }
  }, [mounted, isNew, existingInvoice, form, getNextInvoiceNumber]);

  const items = useWatch({ control: form.control, name: "items" });
  const vatRate = useWatch({ control: form.control, name: "vatRate" });
  const irpfRate = useWatch({ control: form.control, name: "irpfRate" });
  const taxesIncluded = useWatch({ control: form.control, name: "taxesIncluded" });

  useEffect(() => {
    if (!items) return;
    const totals = calculateInvoiceTotals({ 
      items, 
      vatRate: vatRate || 0, 
      irpfRate: irpfRate || 0,
      taxesIncluded: taxesIncluded || false,
    });
    form.setValue("baseTotal", totals.baseTotal);
    form.setValue("vatAmount", totals.vatAmount);
    form.setValue("irpfAmount", totals.irpfAmount);
    form.setValue("totalAmount", totals.totalAmount);
  }, [items, vatRate, irpfRate, taxesIncluded, form]);

  const onSubmit = async (data: InvoiceFormData, targetStatus: "DRAFT" | "PENDING" | "PAID") => {
    setIsSubmitting(true);
    const client = getClientById(data.clientId);
    const finalInvoice: Invoice = {
      ...data,
      id: isNew ? generateId() : invoiceId,
      status: targetStatus === "DRAFT" && data.status !== "DRAFT" ? data.status : targetStatus,
      clientName: client?.name,
      items: data.items.map((i) => ({ ...i, subtotal: i.quantity * i.priceUnit })),
    };
    saveInvoice(finalInvoice);
    if (targetStatus === "PENDING" && client) {
      generateInvoicePDF(finalInvoice, client);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    goToInvoices();
  };

  const handleDownload = () => {
    const data = form.getValues();
    const client = getClientById(data.clientId);
    if (client) generateInvoicePDF({ ...data, id: invoiceId } as Invoice, client);
  };

  const addItem = () => {
    append({ id: generateId(), description: "", quantity: 1, priceUnit: 0, subtotal: 0 });
  };

  if (!mounted) return <div className="p-8 text-muted-foreground">Cargando factura...</div>;

  const status = form.watch("status");
  const isEditable = isNew || status === "DRAFT";

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={goBack}>Volver</Button>
        <div className="flex gap-2">
          {!isEditable && !isSubmitting && (
            <>
              <Button variant="secondary" icon={Download} onClick={handleDownload} type="button">PDF</Button>
              {status === "PENDING" && (
                <Button variant="success" icon={CheckCircle} onClick={form.handleSubmit((d) => onSubmit(d, "PAID"))}>
                  Marcar Pagada
                </Button>
              )}
            </>
          )}
          {isEditable && !isSubmitting && (
            <>
              <Button variant="secondary" icon={Save} onClick={form.handleSubmit((d) => onSubmit(d, "DRAFT"))}>
                Guardar
              </Button>
              <Button variant="primary" icon={FileCheck} onClick={form.handleSubmit((d) => onSubmit(d, "PENDING"))}>
                Emitir
              </Button>
            </>
          )}
          {isSubmitting && (
            <Button variant="ghost" disabled>
              <Loader2 className="animate-spin mr-2" size={18} />Procesando...
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center bg-muted/20">
            <div>
              <CardTitle className="text-lg">
                {isNew ? "Nueva Factura" : `Factura ${form.watch("invoiceNumber")}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Detalles de la operacion</p>
            </div>
            <StatusBadge status={form.watch("status")} />
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <SimpleSelect disabled={!isEditable} {...field}>
                    <option value="">Selecciona un cliente</option>
                    {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </SimpleSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emision</Label>
                <Input type="date" disabled={!isEditable} value={formatDateForInput(form.watch("issueDate"))}
                  onChange={(e) => form.setValue("issueDate", new Date(e.target.value).getTime())} />
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input type="date" disabled={!isEditable} value={formatDateForInput(form.watch("dueDate"))}
                  onChange={(e) => form.setValue("dueDate", new Date(e.target.value).getTime())} />
              </div>
            </div>
          </CardContent>

          <div className="border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Concepto</TableHead>
                  <TableHead className="w-24">Cant.</TableHead>
                  <TableHead className="w-32">Precio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input {...form.register(`items.${index}.description`)} disabled={!isEditable}
                        className="border-transparent focus:border-input px-0 bg-transparent" placeholder="Descripcion..." />
                      {form.formState.errors.items?.[index]?.description && (
                        <span className="text-xs text-destructive">Requerido</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.5" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                        disabled={!isEditable} className="text-center" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" {...form.register(`items.${index}.priceUnit`, { valueAsNumber: true })}
                        disabled={!isEditable} className="text-right" />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.priceUnit`) || 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditable && fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isEditable && (
              <div className="p-4 bg-muted/20 border-b border-border">
                <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addItem}>Anadir Linea</Button>
                {form.formState.errors.items && <p className="text-destructive text-xs mt-2">{form.formState.errors.items.message}</p>}
              </div>
            )}
          </div>

          <div className="bg-muted/10 p-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div className="w-full md:w-1/2 p-4 bg-card rounded-lg border border-border space-y-4">
                {/* Toggle: Impuestos incluidos en precio */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <Label htmlFor="taxesIncluded" className="mb-0 cursor-pointer font-medium">
                      Impuestos incluidos en precio
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.watch("taxesIncluded") 
                        ? "Los precios introducidos YA incluyen IVA/IRPF" 
                        : "Los precios introducidos son BASE (se suma IVA)"}
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="taxesIncluded" 
                    disabled={!isEditable} 
                    checked={form.watch("taxesIncluded") || false}
                    onChange={(e) => form.setValue("taxesIncluded", e.target.checked)}
                    className="w-5 h-5 rounded border-input text-primary focus:ring-ring" 
                  />
                </div>

                <FormField control={form.control} name="vatRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de IVA</FormLabel>
                    <FormControl>
                      <SimpleSelect disabled={!isEditable} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))}>
                        {VAT_RATES.map((rate) => (<option key={rate.value} value={rate.value}>{rate.label}</option>))}
                      </SimpleSelect>
                    </FormControl>
                  </FormItem>
                )} />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="irpf" disabled={!isEditable} checked={form.watch("irpfRate") > 0}
                    onChange={(e) => form.setValue("irpfRate", e.target.checked ? IRPF_RATE : 0)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-ring" />
                  <Label htmlFor="irpf" className="mb-0 cursor-pointer">Aplicar Retencion IRPF (15%)</Label>
                </div>
              </div>
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Imponible</span>
                  <span className="font-mono">{formatCurrency(form.watch("baseTotal"))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA</span>
                  <span className="font-mono">{formatCurrency(form.watch("vatAmount"))}</span>
                </div>
                {form.watch("irpfRate") > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>- IRPF</span>
                    <span className="font-mono">({formatCurrency(form.watch("irpfAmount"))})</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-4 border-t border-border mt-2">
                  <span>TOTAL</span>
                  <span>{formatCurrency(form.watch("totalAmount"))}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default InvoiceFormPage;
