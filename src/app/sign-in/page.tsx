"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

export default function SignInPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const demoEnter = useAuthStore((s) => s.demoEnter);
  const addToast = useAppStore((s) => s.addToast);
  const [email, setEmail] = useState("ritheesh@college.edu");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = signIn(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Unable to sign in");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0c1222] lg:flex lg:flex-col lg:justify-between p-10 text-white">
        <Logo light />
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Collaboration, understood.
          </h1>
          <p className="mt-4 max-w-md text-white/65">
            Sign in to your Mesh workspace — projects, teammates, and AI collaboration
            intelligence in one place.
          </p>
        </div>
        <p className="text-sm text-white/40">ED-03 · Mesh Platform</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your student email or continue with the demo account.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">User ID / Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label htmlFor="password" className="mb-0">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() =>
                    addToast("Password reset instructions sent to student email.", "info")
                  }
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={() => {
              demoEnter();
              addToast("Signed in via Campus Google Workspace", "success");
              router.push("/dashboard");
            }}
          >
            Continue with Google
          </Button>

          <Button
            variant="soft"
            className="mt-3 w-full"
            type="button"
            onClick={() => {
              demoEnter();
              router.push("/dashboard");
            }}
          >
            Enter demo as Ritheesh
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
