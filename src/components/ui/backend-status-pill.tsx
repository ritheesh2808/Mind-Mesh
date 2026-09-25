"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Database, Cpu } from "lucide-react";
import { checkApiHealth, type ApiHealthStatus } from "@/lib/api";

export function BackendStatusPill({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<ApiHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    const health = await checkApiHealth();
    setStatus(health);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    checkApiHealth().then((health) => {
      if (active) {
        setStatus(health);
        setLoading(false);
      }
    });

    const interval = setInterval(() => {
      checkApiHealth().then((health) => {
        if (active) {
          setStatus(health);
        }
      });
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isOnline = !!status && status.status === "healthy";
  const isSupabase = !!status?.supabase_connected;

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-1 text-xs backdrop-blur-xs cursor-pointer hover:border-primary/40 transition"
        onClick={check}
        title={
          isOnline
            ? `FastAPI AI Engine: Online (${isSupabase ? "Supabase Cloud" : "In-Memory State Engine"})`
            : "FastAPI Backend: Offline (Operating in client-side fallback mode)"
        }
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loading
              ? "bg-amber-400 animate-pulse"
              : isOnline
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-slate-400"
          }`}
        />
        <span className="font-medium text-foreground text-[11px]">
          {isOnline ? "AI Engine Online" : "Local Mode"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground">FastAPI:</span>
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            isOnline ? "text-success font-semibold" : "text-amber-600"
          }`}
        >
          {isOnline ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Connected (v{status.version})
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Fallback Local
            </>
          )}
        </span>
      </div>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground">Database:</span>
        <span className="font-medium text-foreground">
          {isSupabase ? "Supabase Cloud RLS" : "High-Speed Memory"}
        </span>
      </div>

      <button
        type="button"
        onClick={check}
        className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition"
        title="Refresh backend connectivity check"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        <span>Ping</span>
      </button>
    </div>
  );
}
