"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getLDWeeklyTarget, getLDEligibleCount, isLDEligibleRombel, getLDWeeklyTargetForBranches } from "../../lib/targets";

const BRANCHES = [
  "Semua Cabang",
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
const ALL_BRANCHES = "Semua Cabang";
const SESSION_TYPES = ["KBM", "Klinik PR", "Trial Class"] as const;
const AUVI_WEEKLY_TARGET = 10;

type MasterRow = { id: string; name: string };
type BranchRow = { id: string; name: string };
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
  branch_id?: string | null;
};

type WeeklyTargetRow = { branch_id: string | null; rombel_id: string | null; auvi_tv: boolean; ld: boolean };

function getTodayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getWeekRange(date: string) {
  const base = new Date(`${date}T00:00:00`);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(base);
  start.setDate(base.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function PlanningPage() {
  const [date, setDate] = useState(getTodayLocal());
  const [branch, setBranch] = useState(ALL_BRANCHES);
  const [branchId, setBranchId] = useState("");
  const [branchRows, setBranchRows] = useState<BranchRow[]>([]);
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
  const [weeklyAuviSessions, setWeeklyAuviSessions] = useState(0);
  const [weeklyLdRombels, setWeeklyLdRombels] = useState(0);

  async function loadMasters() {
    const [bRes, mtRes, rRes, mRes] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);
    const allBranches = (bRes.data || []) as BranchRow[];
    setBranchRows(allBranches);
    if (branch === ALL_BRANCHES) setBranchId("");
    else setBranchId(allBranches.find((b) => b.name === branch)?.id || "");
    setMtRows(mtRes.data || []);
    setRombelRows(rRes.data || []);
    setMapelRows(mRes.data || []);
    setMt(mtRes.data?.[0]?.id || "");
    setRombel(rRes.data?.[0]?.id || "");
    setMapel(mRes.data?.[0]?.id || "");
    if (bRes.error || mtRes.error || rRes.error || mRes.error) setMessage("Gagal memuat master data dari database.");
  }

  async function resolveBranchId() {
    if (branch === ALL_BRANCHES) {
      setBranchId("");
      return "";
    }
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
    let query = supabase
      .from("weekly_planning")
      .select("id,planning_date,jenis_sesi,auvi_tv,ld,status,mt_id,rombel_id,mapel_id,branch_id")
      .eq("planning_date", date)
      .eq("status", "Draft")
      .order("created_at");
    if (id) query = query.eq("branch_id", id);
    const { data, error } = await query;
    if (error) {
      setMessage(`Gagal memuat planning: ${error.message}`);
      setSessions([]);
    } else setSessions((data || []) as PlanningRow[]);
    setLoading(false);
  }

  useEffect(() => { loadMasters(); }, [branch]);
  useEffect(() => { loadSessions(); }, [branch, date]);

  useEffect(() => {
    let cancelled = false;
    async function loadWeeklyProgress() {
      const { start, end } = getWeekRange(date);
      let query = supabase
        .from("weekly_planning")
        .select("branch_id,rombel_id,auvi_tv,ld")
        .gte("planning_date", start)
        .lte("planning_date", end);
      if (branch !== ALL_BRANCHES && branchId) query = query.eq("branch_id", branchId);
      const { data } = await query;
      if (cancelled) return;
      const rows = (data || []) as WeeklyTargetRow[];
      setWeeklyAuviSessions(rows.filter(r => r.auvi_tv).length);
      if (branch === ALL_BRANCHES) {
        const branchNameById = new Map(branchRows.map((b) => [b.id, b.name]));
        const eligiblePairs = rows
          .filter(r => r.ld && r.rombel_id)
          .filter(r => isLDEligibleRombel(branchNameById.get(r.branch_id || "") || "", r.rombel_id))
          .map(r => `${r.branch_id}:${r.rombel_id}`);
        setWeeklyLdRombels(new Set(eligiblePairs).size);
      } else {
        setWeeklyLdRombels(new Set(rows.filter(r => r.ld && isLDEligibleRombel(branch, r.rombel_id)).map(r => r.rombel_id).filter(Boolean)).size);
      }
    }
    loadWeeklyProgress();
    return () => { cancelled = true; };
  }, [branchId, branch, date, branchRows]);

  const selectedDateLabel = formatDate(date);
  const nameOf = (rows: MasterRow[], id: string | null) => rows.find((x) => x.id === id)?.name || "—";
  const totalRombels = new Set(sessions.map((s) => s.rombel_id).filter(Boolean)).size;
  const auviRombels = new Set(sessions.filter((s) => s.auvi_tv).map((s) => s.rombel_id).filter(Boolean)).size;
  const auviCoverage = totalRombels ? Math.round((auviRombels / totalRombels) * 100) : 0;
  const ldCount = sessions.filter((s) => s.ld).length;
  const ldEligible = branch === ALL_BRANCHES ? branchRows.reduce((total, b) => total + getLDEligibleCount(b.name), 0) : getLDEligibleCount(branch);
  const ldTarget = branch === ALL_BRANCHES ? getLDWeeklyTargetForBranches(branchRows.map((b) => b.name)) : getLDWeeklyTarget(branch);

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
    if (!branchId || !mt || !rombel || !mapel) {
      if (!branchId) setMessage("Pilih cabang terlebih dahulu sebelum menambah atau mengedit sesi.");
      return;
    }
    const payload = { branch_id: branchId, planning_date: date, mt_id: mt, rombel_id: rombel, mapel_id: mapel, jenis_sesi: type, auvi_tv: auviTv, ld, status: "Draft" };
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
    const { error } = await supabase.from("weekly_planning").delete().eq("id", id).eq("status", "Draft");
    if (error) setMessage(`Gagal menghapus: ${error.message}`);
    else {
      setMessage("Sesi dihapus dari Draft.");
      await loadSessions();
    }
  }

  async function saveDraft() {
    if (!branchId || sessions.length === 0) return;
    const { error } = await supabase.from("weekly_planning").update({ status: "Draft", updated_at: new Date().toISOString() }).eq("branch_id", branchId).eq("planning_date", date).eq("status", "Draft");
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
    const { error } = await supabase.from("weekly_planning").update({ status: "Finalized", updated_at: new Date().toISOString() }).eq("branch_id", branchId).eq("planning_date", date).eq("status", "Draft");
    if (error) {
      setMessage(`Gagal finalisasi: ${error.message}`);
      return;
    }
    resetForm();
    setMessage("Planning berhasil difinalisasi dan masuk ke Monitoring.");
    setModal("finalize");
    await loadSessions();
  }

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div><div className="eyebrow">MT COACH · OPERATIONS</div><h1>Weekly Planning</h1><p>Susun sesi secara manual, simpan sebagai Draft, lalu finalisasi saat sudah siap.</p></div>
          <span className="badge planning-status">📝 Draft</span>
        </div>
      </section>

      <section className="planning-control-card">
        <div className="control-box"><span className="control-label">Cabang</span><select className="branch-select" value={branch} onChange={(e) => setBranch(e.target.value)}>{BRANCHES.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="control-box"><span className="control-label">Tanggal Planning</span><div className="date-control"><div className="date-icon">📅</div><input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="date-caption">{selectedDateLabel}</div></div>
      </section>

      <div className="grid planning-kpis">
        <div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">Draft Session</div><div className="kpi-mini-icon">📋</div></div><div className="kpi-value">{sessions.length}</div><div className="kpi-note">Sesi yang belum difinalisasi</div></div>
        <div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{weeklyAuviSessions}/{AUVI_WEEKLY_TARGET}</div><div className="kpi-note">Target {AUVI_WEEKLY_TARGET} sesi per minggu</div></div>
        <div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{ldTarget}</div><div className="kpi-note">Target ≥ 50% dari {ldEligible} rombel eligible · absolut per cabang</div></div>
      </div>

      <form className="card input-card" onSubmit={addOrUpdateSession}>
        <div className="section-title"><div><h2>{editingId ? "Edit Sesi" : "Tambah Sesi"}</h2><p>{editingId ? "Perbarui detail sesi lalu simpan perubahan." : <>Input sesi untuk <strong>{selectedDateLabel}</strong>. Jam tidak diperlukan.</>}</p></div><span className="section-chip">SHARED DATABASE</span></div>
        <div className="planning-form-grid">
          <label className="planning-field"><span>MT</span><select value={mt} onChange={(e) => setMt(e.target.value)} disabled={loading} required>{mtRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="planning-field"><span>Rombel</span><select value={rombel} onChange={(e) => setRombel(e.target.value)} disabled={loading} required>{rombelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="planning-field"><span>Mapel</span><select value={mapel} onChange={(e) => setMapel(e.target.value)} disabled={loading} required>{mapelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="planning-field"><span>Jenis Sesi</span><select value={type} onChange={(e) => setType(e.target.value as (typeof SESSION_TYPES)[number])}><option>KBM</option><option>Klinik PR</option><option>Trial Class</option></select></label>
        </div>
        <div className="planning-options"><label className="option-pill"><input type="checkbox" checked={auviTv} onChange={(e) => setAuviTv(e.target.checked)} /> 🎥 AuVi TV</label><label className="option-pill"><input type="checkbox" checked={ld} onChange={(e) => setLd(e.target.checked)} /> 👥 LD</label></div>
        <div style={{ display: "flex", gap: 10 }}><button className="add-session-btn" type="submit" disabled={loading || !branchId}>{editingId ? "💾 Simpan Perubahan" : "＋ Tambah Sesi"}</button>{editingId && <button type="button" className="secondary-btn" onClick={resetForm}>Batal</button>}</div>
      </form>

      <section className="card planning-table-card">
        <div className="planning-table-head"><div><h2>Daftar Sesi</h2><p>{branch} · {selectedDateLabel}</p></div><span className="section-chip">{sessions.length} sesi Draft</span></div>
        <div className="planning-table-wrap"><table><thead><tr><th>MT</th><th>Rombel</th><th>Mapel</th><th>Jenis</th><th>AuVi TV</th><th>LD</th><th>Aksi</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={7}><div className="empty-state"><strong>Memuat data…</strong></div></td></tr> : sessions.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><strong>Belum ada sesi Draft</strong><p>Jika sesi sebelumnya sudah Finalize, sesi tersebut sudah masuk ke Monitoring. Tambahkan sesi baru di form di atas.</p></div></td></tr> : sessions.map((session) => (
            <tr key={session.id}><td><span className="table-primary">{nameOf(mtRows, session.mt_id)}</span></td><td>{nameOf(rombelRows, session.rombel_id)}</td><td><span className="table-primary">{nameOf(mapelRows, session.mapel_id)}</span></td><td>{session.jenis_sesi}</td><td><span className={`badge ${session.auvi_tv ? "green" : "blue"}`}>{session.auvi_tv ? "✓ Assigned" : "— Belum"}</span></td><td><span className={`badge ${session.ld ? "green" : "blue"}`}>{session.ld ? "✓ Assigned" : "— Belum"}</span></td><td><div style={{ display: "flex", gap: 8 }}><button className="row-delete" type="button" onClick={() => deleteSession(session.id)}>Hapus</button><button className="secondary-btn" type="button" onClick={() => startEdit(session)}>✏️ Edit</button></div></td></tr>
          ))}
        </tbody></table></div>
      </section>

      <div className="finalize-bar"><div><strong>{branch}</strong><small>{message || "Input sesi selesai? Simpan dulu sebagai Draft."}</small></div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="secondary-btn" type="button" onClick={saveDraft} disabled={sessions.length === 0 || !branchId}>📝 Simpan sebagai Draft</button><button className="finalize-btn" type="button" onClick={finalize} disabled={sessions.length === 0 || !branchId}>🔒 Finalize Planning</button></div></div>

      {modal && <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><div className="modal-icon">{modal === "finalize" ? "🔒" : "📝"}</div><h3>{modal === "finalize" ? "Planning berhasil difinalisasi" : "Draft berhasil disimpan"}</h3><p>{modal === "finalize" ? "Sesi sudah masuk ke Monitoring untuk dilengkapi administrasinya. Sesi tersebut tidak lagi tampil di Weekly Planning." : "Sesi tetap berada di Weekly Planning dan masih dapat diedit sebelum Finalize."}</p><button className="finalize-btn" type="button" onClick={() => setModal(null)}>OK, Mengerti</button></div></div>}
    </div>
  );
}