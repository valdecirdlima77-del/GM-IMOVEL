import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "GM Negócios Imobiliários — Geisa Macena | CRECI-MS 13.429",
  description:
    "Assessoria em negócios imobiliários: compra, venda, locação, avaliação, regularização e vistorias. Geisa Macena — CRECI-MS 13.429.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-offwhite text-graphite font-body min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
