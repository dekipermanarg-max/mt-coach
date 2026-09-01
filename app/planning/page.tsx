"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const BRANCHES = ["Bukittinggi - Jambu Air", "Bukittinggi - Manggis Ganting", "Painan - Pagaruyung", "Payakumbuh - Simpang Benteng", "Solok - Pandan", "Padang - Gajah Mada", "Padang - S. Parman", "Padang - Sutomo", "Padang - Tarandam", "Padang - Ujung Gurun"];
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
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export default function PlanningPage() {
  const [date, setDate] = useState(DEFAULT_DATE);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [branchId, setBranchId] = useState("");
  const [sessions, setSessions] = useState<PlanningRow[]>([]);
  const [status, setStatus] = useState<"Draft" | "Finalized">("Draft");
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
    if (b.error || mtRes.error || rRes.error || mRes.error) setMessage("Gagal memuat master data dari database.");
  }

  async function loadSessions() {
    setLoading(true);
    const b = await supabase.from("branches").select("id").eq("name", branch).single();
    if (!b.data) {
      setMessage("Cabang tidak ditemukan di database.");
      setLoading(false);
      return;
    }
    setBranchId(b.data.id);
    // Fetch only foreign-key IDs. Names are resolved from the already-loaded master lists.
    // This avoids PostgREST embedded-relation inconsistencies and keeps MT/Rombel/Mapel global.
    const { data, error } = await supabase
      .from("weekly_planning")
      .select("id,planning_date,jenis_sesi,auvi_tv,ld,status,mt_id,rombel_id,mapel_id")
      .eq("branch_id", b.data.id)
      .eq("planning_date", date)
      .order("created_at");
    if (error) {
      setMessage(`Gagal memuat planning: ${error.message}`);
      setSessions([]);
    } else {
      const rows = (data || []) as PlanningRow[];
      setSessions(rows);
      setStatus(rows.some((x) => x.status === "Finalized") ? "Finalized" : "Draft");
    }
    setLoading(false);
  }

  useEffect(() => { loadMasters(); }, [branch]);
  useEffect(() => { loadSessions(); }, [branch, date]);

  const selectedDateLabel = formatDate(date);
  const nameOf = (rows: MasterRow[], id: string | null) => rows.find((x) => x.id === id)?.name || "—";
  const totalRombels = new Set(sessions.map((s) => s.rombel_id).filter(Boolean)).size;
  const auviRombels = new Set(sessions.filter((s) => s.auvi_tv).map((s) => s.rombel_id).filter(Boolean)).size;
  const auviCoverage = totalRombels ? Math.round((auviRombels / totalRombels) * 100) : 0;
  const ldCount = sessions.filter((s) => s.ld).length;

  function startEdit(session: PlanningRow) {
    if (status === "Finalized") return;
    setEditingId(session.id);
    setMt(session.mt_id || "");
    setRombel(session.rombel_id || "");
    setMapel(session.mapel_id || "");
    setType(session.jenis_sesi as (typeof SESSION_TYPES)[number]);
    setAuviTv(session.auvi_tv);
    setLd(session.ld);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setMt(mtRows[0]?.id || "");
    setRombel(rombelRows[0]?.id || "");
    setMapel(mapelRows[0]?.id || "");
    setType("KBM");
    setAuviTv(false);
    setLd(false);
  }

  async function addOrUpdateSession(e: FormEvent) {
    e.preventDefault();
    if (status === "Finalized" || !branchId || !mt || !rombel || !mapel) return;
    const payload = { branch_id: branchId, planning_date: date, mt_id: mt, rombel_id: rombel, mapel_id: mapel, jenis_sesi: type, auvi_tv: auviTv, ld, status: "Draft" };
    const result = editingId
      ? await supabase.from("weekly_planning").update(payload).eq("id", editingId)
      : await supabase.from("weekly_planning").insert(payload);
    if (result.error) {
      setMessage(`Gagal menyimpan sesi: ${result.error.message}`);
      return;
    }
    setMessage(editingId ? "Sesi berhasil diperbarui." : "Sesi berhasil ditambahkan ke Draft.");
    cancelEdit();
    await loadSessions();
  }

  async function deleteSession(id: string) {
    if (status === "Finalized") return;
    const { error } = await supabase.from("weekly_planning").delete().eq("id", id);
    if (error) setMessage(`Gagal menghapus: ${error.message}`);
    else { setMessage("Sesi dihapus."); await loadSessions(); }
  }

  async function saveDraft() {
    if (!branchId) return;
    const { error } = await supabase.from("weekly_planning").update({ status: "Draft", updated_at: new Date().toISOString() }).eq("branch_id", branchId).eq("planning_date", date);
    if (error) { setMessage(`Gagal menyimpan draft: ${error.message}`); return; }
    setStatus("Draft");
    setModal("draft");
    await loadSessions();
  }

  async function finalize() {
    if (!branchId || sessions.length === 0) return;
    const { error } = await supabase.from("weekly_planning").update({ status: "Finalized", updated_at: new Date().toISOString() }).eq("branch_id", branchId).eq("planning_date", date);
    if (error) { setMessage(`Gagal finalisasi: ${error.message}`); return; }
    setStatus("Finalized");
    setModal("finalize");
    await loadSessions();
  }

  return <div className="page-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · OPERATIONS</div><h1>Weekly Planning</h1><p>Susun sesi secara manual, simpan sebagai Draft, lalu finalisasi saat sudah siap.</p></div><span className="badge planning-status">{status === "Draft" ? "📝 Draft" : "🔒 Finalized"}</span></div></section>
    <section className="planning-control-card"><div className="control-box"><span className="control-label">Cabang</span><select className="branch-select" value={branch} onChange={e => setBranch(e.target.value)} disabled={status === "Finalized"}>{BRANCHES.map(item => <option key={item}>{item}</option>)}</select></div><div className="control-box"><span className="control-label">Tanggal Planning</span><div className="date-control"><div className="date-icon">📅</div><input className="date-input" type="date" value={date} onChange={e => setDate(e.target.value)} disabled={status === "Finalized"} /></div><div className="date-caption">{selectedDateLabel}</div></div></section>
    <div className="grid planning-kpis"><div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">Total Session</div><div className="kpi-mini-icon">📋</div></div><div className="kpi-value">{sessions.length}</div><div className="kpi-note">Sesi pada tanggal terpilih</div></div><div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">{auviRombels}/{totalRombels} rombel · target ≥ 50%</div></div><div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{ldCount}<span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 5 }}>/ 10</span></div><div className="kpi-note">Target 10 sesi per minggu</div></div></div>
    <form className="card input-card" onSubmit={addOrUpdateSession}><div className="section-title"><div><h2>{editingId ? "Edit Sesi" : "Tambah Sesi"}</h2><p>{editingId ? "Perbarui detail sesi lalu simpan perubahan." : <>Input sesi untuk <strong>{selectedDateLabel}</strong>. Jam tidak diperlukan.</>}</p></div><span className="section-chip">SHARED DATABASE</span></div><div className="planning-form-grid"><label className="planning-field"><span>MT</span><select value={mt} onChange={e => setMt(e.target.value)} disabled={status === "Finalized" || loading} required>{mtRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="planning-field"><span>Rombel</span><select value={rombel} onChange={e => setRombel(e.target.value)} disabled={status === "Finalized" || loading} required>{rombelRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="planning-field"><span>Mapel</span><select value={mapel} onChange={e => setMapel(e.target.value)} disabled={status === "Finalized" || loading} required>{mapelRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="planning-field"><span>Jenis Sesi</span><select value={type} onChange={e => setType(e.target.value as (typeof SESSION_TYPES)[number])} disabled={status === "Finalized"}><option>KBM</option><option>Klinik PR</option><option>Trial Class</option></select></label></div><div className="planning-options"><label className="option-pill"><input type="checkbox" checked={auviTv} onChange={e => setAuviTv(e.target.checked)} disabled={status === "Finalized"} /> 🎥 AuVi TV</label><label className="option-pill"><input type="checkbox" checked={ld} onChange={e => setLd(e.target.checked)} disabled={status === "Finalized"} /> 👥 LD</label></div><div style={{ display: "flex", gap: 10 }}><button className="add-session-btn" type="submit" disabled={status === "Finalized" || loading}>{editingId ? "💾 Simpan Perubahan" : "＋ Tambah Sesi"}</button>{editingId && <button type="button" className="secondary-btn" onClick={cancelEdit}>Batal</button>}</div></form>
    <section className="card planning-table-card"><div className="planning-table-head"><div><h2>Daftar Sesi</h2><p>{branch} · {selectedDateLabel}</p></div><span className="section-chip">{sessions.length} sesi</span></div><div className="planning-table-wrap"><table><thead><tr><th>MT</th><th>Rombel</th><th>Mapel</th><th>Jenis</th><th>AuVi TV</th><th>LD</th><th>Aksi</th></tr></thead><tbody>{loading ? <tr><td colSpan={7}><div className="empty-state"><strong>Memuat data…</strong></div></td></tr> : sessions.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><strong>Belum ada sesi</strong><p>Tambahkan sesi pertama untuk tanggal ini melalui form di atas.</p></div></td></tr> : sessions.map(session => <tr key={session.id}><td><span className="table-primary">{nameOf(mtRows, session.mt_id)}</span></td><td>{nameOf(rombelRows, session.rombel_id)}</td><td><span className="table-primary">{nameOf(mapelRows, session.mapel_id)}</span></td><td>{session.jenis_sesi}</td><td><span className={`badge ${session.auvi_tv ? "green" : "blue"}`}>{session.auvi_tv ? "✓ Assigned" : "— Belum"}</span></td><td><span className={`badge ${session.ld ? "green" : "blue"}`}>{session.ld ? "✓ Assigned" : "— Belum"}</span></td><td><div style={{ display: "flex", gap: 8 }}><button className="secondary-btn" type="button" onClick={() => startEdit(session)} disabled={status === "Finalized"}>✏️ Edit</button><button className="row-delete" type="button" onClick={() => deleteSession(session.id)} disabled={status === "Finalized"}>Hapus</button></div></td></tr>)}</tbody></table></div></section>
    <div className="finalize-bar"><div><strong>{branch}</strong><small>{message || "Input sesi selesai? Simpan dulu sebagai Draft."}</small></div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><a className="secondary-btn" href="/mt-coach/master-data">⚙️ Kelola Master Data</a><button type="button" className="secondary-btn" onClick={saveDraft} disabled={status === "Finalized"}>📝 Simpan sebagai Draft</button><button type="button" className="primary-btn" onClick={finalize} disabled={status === "Finalized" || sessions.length === 0}>🔒 Finalize Planning</button></div></div>
    {modal && <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,.45)", padding: 20 }}><div role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 420, borderRadius: 24, background: "white", padding: 28, boxShadow: "0 24px 80px rgba(15,23,42,.25)", textAlign: "center" }}><div style={{ fontSize: 46, marginBottom: 10 }}>{modal === "draft" ? "📝" : "🎉"}</div><h3 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{modal === "draft" ? "Draft Berhasil Disimpan" : "Planning Berhasil Difinalisasi"}</h3><p style={{ color: "#64748b", margin: "10px 0 22px", lineHeight: 1.6 }}>{modal === "draft" ? "Weekly Planning sudah tersimpan di database bersama dan masih bisa diedit." : "Weekly Planning sudah difinalisasi. Data sesi sekarang terkunci untuk perubahan."}</p><button type="button" className="primary-btn" onClick={() => setModal(null)}>Oke, Mengerti</button></div></div>}
  </div>;
}
