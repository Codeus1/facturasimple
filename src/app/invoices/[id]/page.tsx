import { InvoiceFormPage } from "@/src/features/invoices/InvoiceFormPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceFormPage invoiceId={id} />;
}
