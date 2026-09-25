import { cn } from "@/lib/utils";

const styles = {
  default: "bg-muted text-foreground",
  primary: "bg-[color-mix(in_oklab,var(--primary)_12%,white)] text-primary",
  success: "bg-[color-mix(in_oklab,var(--success)_12%,white)] text-success",
  warning: "bg-[color-mix(in_oklab,var(--warning)_12%,white)] text-warning",
  danger: "bg-[color-mix(in_oklab,var(--danger)_12%,white)] text-danger",
  outline: "border border-border bg-card text-muted-foreground",
  public: "bg-[color-mix(in_oklab,var(--primary)_12%,white)] text-primary",
  private: "bg-muted text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof styles;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
