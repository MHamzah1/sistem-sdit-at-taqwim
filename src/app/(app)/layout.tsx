import React from "react";
import { AppProvider } from "@/src/lib/context/AppContext";
import { AppShell } from "@/src/components/AppShell";

export const dynamic = "force-dynamic";

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
