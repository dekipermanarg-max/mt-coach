"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../components/AuthProvider";

const BAC_LOGO = "https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/110cf8ca0a782e8ef809a55ed13ae80b.jpg";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user && profile) {
    router.replace("/");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Email atau password salah.");
      setBusy(false);
      return;
    }

    if (!data.user) {
      setError("Login gagal. Silakan coba lagi.");
      setBusy(false);
      return;
    }

    const { data: profileRow } = await supabase
      .from("app_users")
      .select("id,auth_user_id,username,display_name,role,active")
      .eq("auth_user_id", data.user.id)
      .eq("active", true)
      .single();

    if (!profileRow) {
      await supabase.auth.signOut();
      setError("Akun berhasil terautentikasi, tetapi belum memiliki akses MT Coach. Hubungi SUPERADMIN.");
      setBusy(false);
      return;
    }

    router.replace("/");
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f8fafc 0%,#eef4ff 100%)", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 30, boxShadow: "0 20px 60px rgba(15,23,42,.10)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ width: 138, height: 58, border: "1px solid #eef2f7", borderRadius: 12, display: "grid", placeItems: "center", overflow: "hidden", background: "#fff" }}>
            <img src={BAC_LOGO} alt="Brain Academy by Ruangguru" style={{ width: 138, height: 58, objectFit: "contain" }} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: "#2563eb" }}>MT COACH · SECURE ACCESS</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: 28, letterSpacing: "-.03em", color: "#172033" }}>Masuk</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Gunakan akun MT Coach yang sudah terdaftar.</p>
        </div>

        <form onSubmit={submit} style={{ marginTop: 26 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 7 }}>EMAIL</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required placeholder="nama@domain.com" style={{ width: "100%", height: 46, boxSizing: "border-box", border: "1px solid #d8e0ea", borderRadius: 11, padding: "0 13px", outline: "none", fontSize: 13 }} />
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", margin: "16px 0 7px" }}>PASSWORD</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required style={{ width: "100%", height: 46, boxSizing: "border-box", border: "1px solid #d8e0ea", borderRadius: 11, padding: "0 13px", outline: "none", fontSize: 13 }} />
          {error && <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, lineHeight: 1.45 }}>{error}</div>}
          <button type="submit" disabled={busy} style={{ width: "100%", height: 46, marginTop: 18, border: 0, borderRadius: 11, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 13, cursor: busy ? "wait" : "pointer", opacity: busy ? .7 : 1 }}>{busy ? "Memproses…" : "Masuk ke MT Coach"}</button>
        </form>
        <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#94a3b8" }}>Akses cabang dan hak edit ditentukan oleh role akun.</div>
      </section>
    </main>
  );
}
