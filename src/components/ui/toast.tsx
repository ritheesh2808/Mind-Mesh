"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-md)] animate-fade-up"
          )}
        >
          {t.type === "success" && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          )}
          {t.type === "info" && (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          )}
          {t.type === "error" && (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          )}
          <p className="flex-1 text-sm text-foreground">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
