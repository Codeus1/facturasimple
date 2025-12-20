import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { MainLayout } from "@/components/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FacturaSimple B2B",
  description: "Gestión de facturación profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
