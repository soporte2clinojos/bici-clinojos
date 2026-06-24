"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type UserRole = "user" | "admin" | "gatekeeper";

export interface AuthProfile {
  id: string;
  name: string;
  identifier: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  profile: AuthProfile | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
  });

  // Carga el perfil desde public.users
  const fetchProfile = useCallback(
    async (userId: string): Promise<AuthProfile | null> => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, identifier, role")
        .eq("id", userId)
        .single();

      if (error || !data) return null;
      return data as AuthProfile;
    },
    [supabase],
  );

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setState({ user: null, profile: null, role: null, loading: false });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      setState({
        user: session.user,
        profile,
        role: (profile?.role ?? null) as UserRole | null,
        loading: false,
      });
    });

    // Escucha cambios de sesión (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          setState({ user: null, profile: null, role: null, loading: false });
          return;
        }
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          role: (profile?.role ?? null) as UserRole | null,
          loading: false,
        });
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile, supabase]);

  // Logout con redirect a /login
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  // Redirección según rol (útil en layouts protegidos)
  const redirectByRole = useCallback(
    (role: UserRole | null) => {
      if (role === "admin") router.push("/admin");
      else if (role === "gatekeeper") router.push("/gatekeeper");
      else router.push("/dashboard");
    },
    [router],
  );

  return {
    ...state,
    signOut,
    redirectByRole,
    isAdmin: state.role === "admin",
    isGatekeeper: state.role === "gatekeeper",
    isUser: state.role === "user",
  };
}
