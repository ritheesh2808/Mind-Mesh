"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Brain,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Compass,
  Search,
  Settings,
  Users,
  UserRound,
  CheckSquare,
  X,
  Mail,
} from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatRelative, useHydrated } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { BackendStatusPill } from "@/components/ui/backend-status-pill";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/team", label: "Team", icon: Users },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/invitations", label: "Invitations", icon: Mail },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);
  const signOut = useAuthStore((s) => s.signOut);
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [prevPathname, setPrevPathname] = useState(pathname);
  const hydrated = useHydrated();

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
    setNotifOpen(false);
  }

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (!profileComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, isAuthenticated, profileComplete, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="skeleton h-10 w-40" />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.read).length;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  const submitSearch = () => {
    const query = search.trim();
    if (query) router.push(`/discover?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-[#0c1222]/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo light href="/dashboard" />
          <button
            className="lg:hidden text-sidebar-muted"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            title="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-sidebar-muted">{user.department}</p>
            </div>
            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={onSearch} className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="Search projects, skills, people…"
              className="h-10 border-transparent bg-muted pl-9 pr-11 shadow-none focus-visible:bg-card"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <BackendStatusPill compact />
            <div className={cn("relative", notifOpen && "z-40")}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(notifOpen && "relative z-50")}
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
                )}
              </Button>
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 z-40 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lg)] animate-fade-up sm:w-96">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="font-display text-sm font-semibold">Notifications</p>
                    <button
                      onClick={markAll}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          setNotifOpen(false);
                          if (n.href) router.push(n.href);
                        }}
                        className={cn(
                          "flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left transition hover:bg-muted/60",
                          !n.read && "bg-[color-mix(in_oklab,var(--primary)_6%,white)]"
                        )}
                      >
                        <span className="text-sm font-medium">{n.title}</span>
                        <span className="text-xs text-muted-foreground">{n.body}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelative(n.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/notifications"
                    className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all
                  </Link>
                </div>
              </>
            )}
          </div>
            <Link href="/profile" className="hidden sm:block">
              <Avatar name={user.name} />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
