"use client";

import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { BlockProvider } from "@/modules/blocks/context/BlockContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BlockProvider>
          {children}
        </BlockProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
