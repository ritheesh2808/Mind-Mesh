import { cn, initials } from "@/lib/utils";

const colors = [
  "bg-[#0f766e]",
  "bg-[#c2410c]",
  "bg-[#1d4ed8]",
  "bg-[#7c2d12]",
  "bg-[#334155]",
  "bg-[#0e7490]",
];

export function Avatar({
  name = "User",
  src,
  size = "md",
  className,
}: {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
    xl: "h-16 w-16 text-lg",
  };
  const safeName = (name || "User").trim() || "User";
  const charCode = safeName.charCodeAt(0) || 65;
  const color = colors[charCode % colors.length];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={safeName}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0",
        color,
        sizes[size],
        className
      )}
      title={safeName}
    >
      {initials(safeName)}
    </div>
  );
}

export function AvatarGroup({
  names,
  max = 4,
}: {
  names: string[];
  max?: number;
}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size="sm" className="ring-2 ring-card" />
      ))}
      {rest > 0 && (
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
          +{rest}
        </div>
      )}
    </div>
  );
}
