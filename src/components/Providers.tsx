"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AuthContentProvider } from "@/context/AuthContentContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthContentProvider>{children}</AuthContentProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

