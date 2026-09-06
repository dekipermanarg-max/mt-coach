"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export type AppRole = "SUPERADMIN" | "ATASAN" | "MTC" | "ADMIN";

type AppProfile = {
  id: string;
  auth_user_id: string;
  username: string;
  display_name: string;
  role: AppRole;
  active: boolean;
};

type Branch = { id: string; name: string };

type AuthContextValue = {
  loading: boolean;
  user: { id: string; email?: string } | null;
  profile: AppProfile | null;
  branches: Branch[];
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  async function loadProfile() {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setBranches([]);
      setLoading(false);
      return;
    }

    setUser({ id: authUser.id, email: authUser.email || undefined });
    const { data: p, error } = await supabase
      .from("app_users")
      .select("id,auth_user_id,username,display_name,role,active")
      .eq("auth_user_id", authUser.id)
      .eq("active", true)
      .single();

    if (error || !p) {
      setProfile(null);
      setBranches([]);
      setLoading(false);
      return;
    }

    const appProfile = p as AppProfile;
    setProfile(appProfile);

    if (appProfile.role === "SUPERADMIN" || appProfile.role === "ATASAN") {
      const { data } = await supabase.from("branches").select("id,name").eq("active", true).order("name");
      setBranches((data || []) as Branch[]);
    } else {
      const { data } = await supabase
        .from("user_branch_access")
        .select("branch_id,branches!inner(id,name)")
        .eq("user_id", appProfile.id);
      const mapped = (data || []).map((row: any) => row.branches).filter(Boolean) as Branch[];
      setBranches(mapped.sort((a, b) => a.name.localeCompare(b.name)));
    }
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    void loadProfile();

    const { data } = supabase.auth.onAuthStateChange(async () => {
      if (!mounted) return;
      await loadProfile();
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    user,
    profile,
    branches,
    isAuthenticated: Boolean(user && profile),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: loadProfile,
  }), [loading, user, profile, branches]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
