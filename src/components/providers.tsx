"use client";

import { ToastViewport } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
