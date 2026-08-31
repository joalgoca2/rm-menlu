import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menlu 门路 | Gestión Inteligente & Gamificación para Dojos",
  description:
    "Plataforma B2B SaaS para escuelas de artes marciales en Latinoamérica. Multi-disciplina, cobros locales, torneos y la app El Camino del Esfuerzo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200 antialiased">
        <AppProviders>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
