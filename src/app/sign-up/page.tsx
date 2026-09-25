"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";

export default function SignUpPage() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    signUp({ name, email, password });
    router.push("/onboarding");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0c1222] lg:flex lg:flex-col lg:justify-between p-10 text-white">
        <Logo light />
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Create your Mesh identity.
          </h1>
          <p className="mt-4 max-w-md text-white/65">
            Set up once — then discover projects, match teammates, and get collaboration
            insights that actually help.
          </p>
        </div>
        <p className="text-sm text-white/40">Takes under 2 minutes</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-2xl font-semibold">Create account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
