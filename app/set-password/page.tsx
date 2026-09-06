"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const BAC_LOGO = "https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/110cf8ca0a782e8ef809a55ed13ae80b.jpg";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function prepareAccount() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        setError("Link sudah tidak aktif atau belum diverifikasi. Silakan buka kembali link undangan/password terbaru dari email.");
        setChecking(false);
        return;
      }

      setEmail(data.session.user.email || "");

      const { error: claimError } = await supabase.rpc("claim_my_app_user");
      if (!active) return;

      if (claimError) {
        setError("Akun berhasil diverifikasi, tetapi belum terhubung ke data akun MT Coach. Hubungi SUPERADMIN.");
      }
      setChecking(false);
    }

    void prepareAccount();
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setBusy(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    setMessage("Password berhasil dibuat. Silakan masuk ke MT Coach.");
    setTimeout(() => router.replace("/login"), 1200);
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
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: "#2563eb" }}>MT COACH · ACCOUNT SETUP</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: 28, letterSpacing: "-.03em", color: "#172033" }}>Buat Password</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{email ? `Akun: ${email}` : "Buat password untuk akun MT Coach kamu."}</p>
        </div>

        {checking ? (
          <div style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: "#64748b" }}>Memverifikasi undangan dan akun…</div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 26 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 7 }}>PASSWORD BARU</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" minLength={8} required style={{ width: "100%", height: 46, boxSizing: "border-box", border: "1px solid #d8e0ea", borderRadius: 11, padding: "0 13px", outline: "none", fontSize: 13 }} />
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#475569", margin: "16px 0 7px" }}>KONFIRMASI PASSWORD</label>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" autoComplete="new-password" minLength={8} required style={{ width: "100%", height: 46, boxSizing: "border-box", border: "1px solid #d8e0ea", borderRadius: 11, padding: "0 13px", outline: "none", fontSize: 13 }} />
            {error && <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, lineHeight: 1.45 }}>{error}</div>}
            {message && <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 12, lineHeight: 1.45 }}>{message}</div>}
            <button type="submit" disabled={busy || !!error || !!message} style={{ width: "100%", height: 46, marginTop: 18, border: 0, borderRadius: 11, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 13, cursor: busy ? "wait" : "pointer", opacity: busy ? .7 : 1 }}>{busy ? "Menyimpan…" : "Simpan Password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
