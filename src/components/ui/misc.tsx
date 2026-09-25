import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  light,
  href = "/",
}: {
  className?: string;
  light?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg",
          light ? "bg-white/10" : "bg-primary"
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden
        >
          <circle cx="4" cy="4" r="2" fill={light ? "#5eead4" : "#ccfbf1"} />
          <circle cx="14" cy="4" r="2" fill={light ? "#99f6e4" : "#f0fdfa"} />
          <circle cx="9" cy="14" r="2" fill={light ? "#5eead4" : "#ccfbf1"} />
          <path
            d="M5.5 5L8 12.5M12.5 5L10 12.5M6 4.5h6"
            stroke={light ? "#99f6e4" : "#f0fdfa"}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          light ? "text-white" : "text-foreground"
        )}
      >
        Mesh
      </span>
    </Link>
  );
}

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
