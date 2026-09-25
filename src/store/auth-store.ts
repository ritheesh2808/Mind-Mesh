"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CURRENT_USER_ID, users } from "@/lib/mock-data";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  profileComplete: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signUp: (data: {
    name: string;
    email: string;
    password: string;
  }) => { ok: boolean; error?: string };
  completeProfile: (partial: Partial<User>) => void;
  updateProfile: (partial: Partial<User>) => void;
  signOut: () => void;
  demoEnter: () => void;
}

const demoLeadUser = users.find((u) => u.id === CURRENT_USER_ID) || null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: demoLeadUser,
      isAuthenticated: true,
      profileComplete: true,

      signIn: (email, password) => {
        if (!password) {
          return { ok: false, error: "Password is required" };
        }
        const existing = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (existing) {
          set({
            user: existing,
            isAuthenticated: true,
            profileComplete: true,
          });
          return { ok: true };
        }
        const current = get().user;
        if (current && current.email.toLowerCase() === email.toLowerCase()) {
          set({ isAuthenticated: true });
          return { ok: true };
        }
        // Demo fallback: accept any credentials and use default user
        const demo = users.find((u) => u.id === CURRENT_USER_ID)!;
        set({
          user: { ...demo, email },
          isAuthenticated: true,
          profileComplete: true,
        });
        return { ok: true };
      },

      signUp: ({ name, email }) => {
        const newUser: User = {
          id: `u-${Date.now()}`,
          name,
          email,
          role: "Student",
          organization: "",
          department: "",
          skills: [],
          interests: [],
          previousProjects: [],
        };
        set({
          user: newUser,
          isAuthenticated: true,
          profileComplete: false,
        });
        return { ok: true };
      },

      completeProfile: (partial) => {
        const user = get().user;
        if (!user) return;
        set({
          user: { ...user, ...partial },
          profileComplete: true,
        });
      },

      updateProfile: (partial) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, ...partial } });
      },

      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          profileComplete: false,
        }),

      demoEnter: () => {
        const demo = users.find((u) => u.id === CURRENT_USER_ID)!;
        set({
          user: demo,
          isAuthenticated: true,
          profileComplete: true,
        });
      },
    }),
    { name: "mesh-auth" }
  )
);
