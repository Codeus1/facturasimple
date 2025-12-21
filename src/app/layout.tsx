import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { MainLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/providers/AuthProvider";
import { getSessionFromRequest } from "@/lib/auth/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FacturaSimple B2B",
  description: "Gestión de facturación profesional",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionFromRequest();

  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider initialSession={session}>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
