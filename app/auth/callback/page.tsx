"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Memverifikasi undangan…");

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("Link undangan tidak dapat diverifikasi. Silakan buka kembali link terbaru dari email.");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        router.replace("/set-password");
      } else {
        setMessage("Sesi undangan belum tersedia. Silakan buka kembali link undangan dari email.");
      }
    }

    void handleCallback();
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f8fafc 0%,#eef4ff 100%)", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 30, boxShadow: "0 20px 60px rgba(15,23,42,.10)", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: "#2563eb" }}>DASHBOARD ADMINISTRASI MT REGIONAL SUMBAR</div>
        <h1 style={{ margin: "8px 0 6px", fontSize: 26, letterSpacing: "-.03em", color: "#172033" }}>Menyiapkan Akun</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{message}</p>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8fafc" }}><p style={{ color: "#64748b" }}>Menyiapkan akun…</p></main>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
