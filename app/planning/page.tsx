"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const BRANCHES = [
  "Bukittinggi - Jambu Air",
  "Bukittinggi - Manggis Ganting",
  "Painan - Pagaruyung",
  "Payakumbuh - Simpang Benteng",
  "Solok - Pandan",
  "Padang - Gajah Mada",
  "Padang - S. Parman",
  "Padang - Sutomo",
  "Padang - Tarandam",
  "Padang - Ujung Gurun",
];
const DEFAULT_DATE = "2026-08-31";
const SESSION_TYPES = ["KBM", "Klinik PR", "Trial Class"] as const;

type MasterRow = { id: string; name: string };
type PlanningRow = {
  id: string;
  planning_date: string;
  jenis_sesi: string;
  auvi_tv: boolean;
  ld: boolean;
  status: string;
  mt_id: string | null;
  rombel_id: string | null;
  mapel_id: string | null;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function PlanningPage() {
  const [date, setDate] = useState(DEFAULT_DATE);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [branchId, setBranchId] = useState("");
  // IMPORTANT: Planning only displays Draft rows. Finalized rows are owned by Monitoring.
  const [sessions, setSessions] = useState<PlanningRow[]>([]);
  const [mtRows, setMtRows] = useState<MasterRow[]>([]);
  const [rombelRows, setRombelRows] = useState<MasterRow[]>([]);
  const [mapelRows, setMapelRows] = useState<MasterRow[]>([]);
  const [mt, setMt] = useState("");
  const [rombel, setRombel] = useState("");
  const [mapel, setMapel] = useState("");
  const [type, setType] = useState<(typeof SESSION_TYPES)[number]>("KBM");
  const [auviTv, setAuviTv] = useState(false);
  const [ld, setLd] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<"draft" | "finalize" | null>(null);

  async function loadMasters() {
    const [b, mtRes, rRes, mRes] = await Promise.all([
      supabase.from("branches").select("id,name").eq("name", branch).single(),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);
    if (b.data) setBranchId(b.data.id);
    setMtRows(mtRes.data || []);
    setRombelRows(rRes.data || []);
    setMapelRows(mRes.data || []);
    setMt(mtRes.data?.[0]?.id || "");
    setRombel(rRes.data?.[0]?.id || "");
    setMapel(mRes.data?.[0]?.id || "");
    if (b.error || mtRes.error || rRes.error || mRes.error) {
      setMessage("Gagal memuat master data dari database.");
    }
  }

  async function resolveBranchId() {
    const b = await supabase.from("branches").select("id").eq("name", branch).single();
    if (b.data) {
      setBranchId(b.data.id);
      return b.data.id as string;
    }
    setMessage("Cabang tidak ditemukan di database.");
    return "";
  }

  async function loadSessions() {
    setLoading(true);
    const id = await resolveBranchId();
    if (!id) {
      setSessions([]);
      setLoading(false);
      return;
    }

    // Finalized rows are deliberately excluded from Weekly Planning.
    // They remain in Supabase and are shown by Monitoring.
    const { data, error } = await supabase
      .from("weekly_planning")
      .select("id,planning_date,jenis_sesi,auvi_tv,ld,status,mt_id,rombel_id,mapel_id")
      .eq("branch_id", id)
      .eq("planning_date", date)
      .eq("status", "Draft")
      .order("created_at");

    if (error) {
      setMessage(`Gagal memuat planning: ${error.message}`);
      setSessions([]);
    } else {
      setSessions((data || []) as PlanningRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMasters();
  }, [branch]);

  useEffect(() => {
    loadSessions();
  }, [branch, date]);

  const selectedDateLabel = formatDate(date);
  const nameOf = (rows: MasterRow[], id: string | null) =>
    rows.find((x) => x.id === id)?.name || "—";
  const totalRombels = new Set(sessions.map((s) => s.rombel_id).filter(Boolean)).size;
  const auviRombels = new Set(
    sessions.filter((s) => s.auvi_tv).map((s) => s.rombel_id).filter(Boolean),
  ).size;
  const auviCoverage = totalRombels ? Math.round((auviRombels / totalRombels) * 100) : 0;
  const ldCount = sessions.filter((s) => s.ld).length;

  function resetForm() {
    setEditingId(null);
    setMt(mtRows[0]?.id || "");
    setRombel(rombelRows[0]?.id || "");
    setMapel(mapelRows[0]?.id || "");
    setType("KBM");
    setAuviTv(false);
    setLd(false);
  }

  function startEdit(session: PlanningRow) {
    setEditingId(session.id);
    setMt(session.mt_id || "");
    setRombel(session.rombel_id || "");
    setMapel(session.mapel_id || "");
    setType(session.jenis_sesi as (typeof SESSION_TYPES)[number]);
    setAuviTv(session.auvi_tv);
    setLd(session.ld);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addOrUpdateSession(e: FormEvent) {
    e.preventDefault();
    if (!branchId || !mt || !rombel || !mapel) return;

    const payload = {
      branch_id: branchId,
      planning_date: date,
      mt_id: mt,
      rombel_id: rombel,
      mapel_id: mapel,
      jenis_sesi: type,
      auvi_tv: auviTv,
      ld,
      status: "Draft",
    };

    const result = editingId
      ? await supabase.from("weekly_planning").update(payload).eq("id", editingId).eq("status", "Draft")
      : await supabase.from("weekly_planning").insert(payload);

    if (result.error) {
      setMessage(`Gagal menyimpan sesi: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? "Sesi berhasil diperbarui." : "Sesi berhasil ditambahkan ke Draft.");
    resetForm();
    await loadSessions();
  }

  async function deleteSession(id: string) {
    const { error } = await supabase
      .from("weekly_planning")
      .delete()
      .eq("id", id)
      .eq("status", "Draft");
    if (error) {
      setMessage(`Gagal menghapus: ${error.message}`);
    } else {
      setMessage("Sesi dihapus dari Draft.");
      await loadSessions();
    }
  }

  async function saveDraft() {
    if (!branchId || sessions.length === 0) return;
    const { error } = await supabase
      .from("weekly_planning")
      .update({ status: "Draft", updated_at: new Date().toISOString() })
      .eq("branch_id", branchId)
      .eq("planning_date", date)
      .eq("status", "Draft");

    if (error) {
      setMessage(`Gagal menyimpan draft: ${error.message}`);
      return;
    }
    setMessage("Draft berhasil disimpan.");
    setModal("draft");
    await loadSessions();
  }

  async function finalize() {
    if (!branchId || sessions.length === 0) return;

    const { error } = await supabase
      .from("weekly_planning")
      .update({ status: "Finalized", updated_at: new Date().toISOString() })
      .eq("branch_id", branchId)
      .eq("planning_date", date)
      .eq("status", "Draft");

    if (error) {
      setMessage(`Gagal finalisasi: ${error.message}`);
      return;
    }

    // The reload intentionally returns zero rows because Planning only shows Drafts.
    // The finalized sessions are now available in Monitoring.
    resetForm();
    setMessage("Planning berhasil difinalisasi dan masuk ke Monitoring.");
    setModal("finalize");
    await loadSessions();
  }

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div>
            <div className="eyebrow">MT COACH · OPERATIONS</div>
            <h1>Weekly Planning</h1>
            <p>Susun sesi secara manual, simpan sebagai Draft, lalu finalisasi saat sudah siap.</p>
          </div>
          <span className="badge planning-status">📝 Draft</span>
        </div>
      </section>

      <section className="planning-control-card">
        <div className="control-box">
          <span className="control-label">Cabang</span>
          <select className="branch-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
            {BRANCHES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="control-box">
          <span className="control-label">Tanggal Planning</span>
          <div className="date-control">
            <div className="date-icon">📅</div>
            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="date-caption">{selectedDateLabel}</div>
        </div>
      </section>

      <div className="grid planning-kpis">
        <div className="card planning-kpi">
          <div className="planning-kpi-top"><div className="kpi-label">Draft Session</div><div className="kpi-mini-icon">📋</div></div>
          <div className="kpi-value">{sessions.length}</div>
          <div className="kpi-note">Sesi yang belum difinalisasi</div>
        </div>
        <div className="card planning-kpi">
          <div className="planning-kpi-top"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-mini-icon">🎥</div></div>
          <div className="kpi-value">{auviCoverage}%</div>
          <div className="kpi-note">{auviRombels}/{totalRombels} rombel · target ≥ 50%</div>
        </div>
        <div className="card planning-kpi">
          <div className="planning-kpi-top"><div className="kpi-label">LD</div><div className="kpi-mini-icon">👥</div></div>
          <div className="kpi-value">{ldCount}<span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 5 }}>/ 10</span></div>
          <div className="kpi-note">Target 10 sesi per minggu</div>
        </div>
      </div>

      <form className="card input-card" onSubmit={addOrUpdateSession}>
        <div className="section-title">
          <div>
            <h2>{editingId ? "Edit Sesi" : "Tambah Sesi"}</h2>
            <p>{editingId ? "Perbarui detail sesi lalu simpan perubahan." : <>Input sesi untuk <strong>{selectedDateLabel}</strong>. Jam tidak diperlukan.</>}</p>
          </div>
          <span className="section-chip">SHARED DATABASE</span>
        </div>

        <div className="planning-form-grid">
          <label className="planning-field"><span>MT</span><select value={mt} onChange={(e) => setMt(e.target.value)} disabled={loading} required>{mtRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="planning-field"><span>Rombel</span><select value={rombel} onChange={(e) => setRombel(e.target.value)} disabled={loading} required>{rombelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="planning-field"><span>Mapel</span><select value={mapel} onChange={(e) => setMapel(e.target.value)} disabled={loading} required>{mapelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="planning-field"><span>Jenis Sesi</span><select value={type} onChange={(e) => setType(e.target.value as (typeof SESSION_TYPES)[number])}><option>KBM</option><option>Klinik PR</option><option>Trial Class</option></select></label>
        </div>

        <div className="planning-options">
          <label className="option-pill"><input type="checkbox" checked={auviTv} onChange={(e) => setAuviTv(e.target.checked)} /> 🎥 AuVi TV</label>
          <label className="option-pill"><input type="checkbox" checked={ld} onChange={(e) => setLd(e.target.checked)} /> 👥 LD</label>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="add-session-btn" type="submit" disabled={loading}>{editingId ? "💾 Simpan Perubahan" : "＋ Tambah Sesi"}</button>
          {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>Batal</button>}
        </div>
      </form>

      <section className="card planning-table-card">
        <div className="planning-table-head">
          <div><h2>Daftar Sesi</h2><p>{branch} · {selectedDateLabel}</p></div>
          <span className="section-chip">{sessions.length} sesi Draft</span>
        </div>
        <div className="planning-table-wrap">
          <table>
            <thead><tr><th>MT</th><th>Rombel</th><th>Mapel</th><th>Jenis</th><th>AuVi TV</th><th>LD</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7}><div className="empty-state"><strong>Memuat data…</strong></div></td></tr> : sessions.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><strong>Belum ada sesi Draft</strong><p>Jika sesi sebelumnya sudah Finalize, sesi tersebut sudah masuk ke Monitoring. Tambahkan sesi baru di form di atas.</p></div></td></tr>
              ) : sessions.map((session) => (
                <tr key={session.id}>
                  <td><span className="table-primary">{nameOf(mtRows, session.mt_id)}</span></td>
                  <td>{nameOf(rombelRows, session.rombel_id)}</td>
                  <td><span className="table-primary">{nameOf(mapelRows, session.mapel_id)}</span></td>
                  <td>{session.jenis_sesi}</td>
                  <td><span className={`badge ${session.auvi_tv ? "green" : "blue"}`}>{session.auvi_tv ? "✓ Assigned" : "— Belum"}</span></td>
                  <td><span className={`badge ${session.ld ? "green" : "blue"}`}>{session.ld ? "✓ Assigned" : "— Belum"}</span></td>
                  <td><div style={{ display: "flex", gap: 8 }}><button className="secondary-btn" type="button" onClick={() => startEdit(session)}>✏️ Edit</button><button className="row-delete" type="button" onClick={() => deleteSession(session.id)}>Hapus</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="finalize-bar">
        <div><strong>{branch}</strong><small>{message || "Input sesi selesai? Simpan dulu sebagai Draft."}</small></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="secondary-btn" href="/mt-coach/master-data">⚙️ Kelola Master Data</a>
          <button className="secondary-btn" type="button" onClick={saveDraft} disabled={sessions.length === 0}>📝 Simpan sebagai Draft</button>
          <button className="finalize-btn" type="button" onClick={finalize} disabled={sessions.length === 0}>🔒 Finalize Planning</button>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{modal === "finalize" ? "🔒" : "📝"}</div>
            <h3>{modal === "finalize" ? "Planning berhasil difinalisasi" : "Draft berhasil disimpan"}</h3>
            <p>{modal === "finalize" ? "Sesi sudah masuk ke Monitoring untuk dilengkapi administrasinya. Sesi tersebut tidak lagi tampil di Weekly Planning." : "Sesi tetap berada di Weekly Planning dan masih dapat diedit sebelum Finalize."}</p>
            <button className="finalize-btn" type="button" onClick={() => setModal(null)}>OK, Mengerti</button>
          </div>
        </div>
      )}
    </div>
  );
}
