"use client";

import { Toaster } from "sonner";
import { SessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";
import { ThemeStyleProvider } from "@/components/theme-style-provider";
import { I18nProvider } from "./i18n-provider";
import { PwaProvider } from "./pwa-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ThemeProvider>
          <ThemeStyleProvider>
            <PwaProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                expand={true}
                visibleToasts={6}
                duration={4000}
                toastOptions={{
                  style: {
                    zIndex: 999999,
                  },
                }}
              />
            </PwaProvider>
          </ThemeStyleProvider>
        </ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
