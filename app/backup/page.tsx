"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

const TABLES = ["branches", "master_mt", "master_rombel", "master_mapel", "weekly_planning"] as const;

function stamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastBackup, setLastBackup] = useState("");

  async function createBackup() {
    setLoading(true);
    setMessage("");
    const result: Record<string, unknown> = {};
    try {
      for (const table of TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw new Error(`${table}: ${error.message}`);
        result[table] = data || [];
      }
      const { data: audit, error: auditError } = await supabase
        .from("audit_log")
        .select("id,table_name,record_id,action,old_data,new_data,changed_at")
        .order("changed_at", { ascending: false });
      if (auditError) throw new Error(`audit_log: ${auditError.message}`);
      result.audit_log = audit || [];
      result._meta = { generated_at: new Date().toISOString(), tables: TABLES, includes: "current data + audit history" };
      const filename = `MT-Coach_Backup_${stamp()}.json`;
      downloadJson(filename, result);
      const now = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
      setLastBackup(now);
      setMessage(`Backup berhasil dibuat: ${filename}`);
    } catch (e) {
      setMessage(`Backup gagal: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return <main className="page-wrap">
    <section className="planning-hero">
      <div className="planning-hero-row">
        <div><div className="eyebrow">MT COACH · DATA SAFETY</div><h1>Backup & Audit</h1><p>Cadangkan seluruh data aplikasi dan lihat riwayat perubahan data.</p></div>
        <span className="badge planning-status">🛡️ Data Protection</span>
      </div>
    </section>

    <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 20 }}>
      <div className="card" style={{ padding: 22 }}>
        <div className="kpi-label">FULL BACKUP</div>
        <h2 style={{ margin: "8px 0" }}>💾 Backup Database</h2>
        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Download satu file JSON berisi Branch, Master MT, Rombel, Mapel, Weekly Planning/Monitoring, dan Audit Log.</p>
        <button className="primary-btn" onClick={createBackup} disabled={loading}>{loading ? "⏳ Membuat backup..." : "⬇️ Backup Sekarang"}</button>
        {lastBackup && <div style={{ marginTop: 10, color: "#16a34a", fontSize: 12 }}>Terakhir: {lastBackup}</div>}
      </div>
      <div className="card" style={{ padding: 22 }}>
        <div className="kpi-label">AUTOMATIC AUDIT</div>
        <h2 style={{ margin: "8px 0" }}>📝 Riwayat Perubahan</h2>
        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Setiap INSERT, UPDATE, dan DELETE pada data utama otomatis dicatat di database, termasuk nilai sebelum dan sesudah perubahan.</p>
        <div className="badge green">✓ Aktif</div>
      </div>
    </section>

    {message && <div className="card" style={{ marginTop: 16, padding: 14 }}>{message}</div>}

    <section className="card" style={{ marginTop: 16, padding: 22 }}>
      <h2 style={{ margin: "0 0 8px" }}>Apa yang dibackup?</h2>
      <div style={{ display: "grid", gap: 8, color: "#475569", fontSize: 13 }}>
        <div>🏫 <b>Branches</b> — seluruh cabang</div>
        <div>👤 <b>Master MT</b> — nama, base, status</div>
        <div>📚 <b>Master Rombel</b> — rombel, cabang, status</div>
        <div>📖 <b>Master Mapel</b> — daftar mapel</div>
        <div>📅 <b>Weekly Planning + Monitoring</b> — sesi dan seluruh administrasinya</div>
        <div>📝 <b>Audit Log</b> — perubahan tambah, ubah, dan hapus</div>
      </div>
      <p style={{ margin: "16px 0 0", color: "#94a3b8", fontSize: 11 }}>Dashboard dan Performance tidak disimpan sebagai data terpisah karena keduanya dihitung dari data sumber.</p>
    </section>
  </main>;
}
