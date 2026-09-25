import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSyncExternalStore } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const emptySubscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export const useMounted = useHydrated;

export function initials(name?: string | null) {
  if (!name || !name.trim()) return "U";
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

export function formatRelative(date: string | Date | undefined | null) {
  if (!date) return "Recently";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Recently";
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(date: string | Date | undefined | null) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hours}:${mins}`;
}

