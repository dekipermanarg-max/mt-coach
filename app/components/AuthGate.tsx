"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user, profile } = useAuth();
  const isLogin = pathname === "/login" || pathname === "/login/";
  const isSetPassword = pathname === "/set-password" || pathname === "/set-password/";
  const isAuthCallback = pathname === "/auth/callback" || pathname === "/auth/callback/";
  const isMathchamps = pathname === "/sessions" || pathname.startsWith("/sessions/");

  useEffect(() => {
    if (loading) return;
    if (isLogin) {
      if (user && profile) router.replace(profile.module_scope === "MATHCHAMPS_ONLY" ? "/sessions" : "/");
      return;
    }
    if (isSetPassword || isAuthCallback) return;
    if (!user || !profile) {
      router.replace("/login");
      return;
    }
    if (profile.module_scope === "MATHCHAMPS_ONLY" && !isMathchamps) {
      router.replace("/sessions");
    }
  }, [loading, user, profile, isLogin, isSetPassword, isAuthCallback, isMathchamps, router]);

  if (isLogin || isSetPassword || isAuthCallback) return <>{children}</>;
  if (loading || !user || !profile) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#64748b", fontFamily: "Inter, Arial, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#172033" }}>MT Coach</div>
          <div style={{ marginTop: 6, fontSize: 12 }}>Memeriksa sesi login…</div>
        </div>
      </div>
    );
  }
  if (profile.module_scope === "MATHCHAMPS_ONLY" && !isMathchamps) return null;

  return <>{children}</>;
}
