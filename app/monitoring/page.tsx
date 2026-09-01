"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type MasterRow = { id: string; name: string };
type MonitoringRow = {
  id: string; planning_date: string; branch_id: string; mt_id: string | null; rombel_id: string | null; mapel_id: string | null;
  jenis_sesi: string; auvi_tv: boolean; ld: boolean; topik_sub_topik: string | null; topik_sub_topik_done: boolean;
  attendance: boolean; starchamps: boolean; activity_score: boolean; report_sessions: boolean; foto_kbm: boolean; report_wa: boolean;
  auvi_tv_status: string; ld_status: string;
};

const AUVISTATUSES = ["Bukan sesi AuVi TV", "Tidak connect ke TV", "Connect ke TV"];
const LDSTATUSES = ["Bukan sesi LD", "Sudah report di CMS", "Belum report ke CMS"];
const ADMIN_KEYS = ["topik_sub_topik_done", "attendance", "starchamps", "activity_score", "report_sessions", "foto_kbm", "report_wa"] as const;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export default function Monitoring() {
  const [rows, setRows] = useState<MonitoringRow[]>([]);
  const [branches, setBranches] = useState<MasterRow[]>([]);
  const [mts, setMts] = useState<MasterRow[]>([]);
  const [rombels, setRombels] = useState<MasterRow[]>([]);
  const [mapels, setMapels] = useState<MasterRow[]>([]);
  const [branchId, setBranchId] = useState("all");
  const [selectedMT, setSelectedMT] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showWaReport, setShowWaReport] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    const [b, mt, r, m] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);
    setBranches(b.data || []); setMts(mt.data || []); setRombels(r.data || []); setMapels(m.data || []);
    const { data, error } = await supabase.from("weekly_planning")
      .select("id,planning_date,branch_id,mt_id,rombel_id,mapel_id,jenis_sesi,auvi_tv,ld,topik_sub_topik,topik_sub_topik_done,attendance,starchamps,activity_score,report_sessions,foto_kbm,report_wa,auvi_tv_status,ld_status")
      .eq("status", "Finalized").order("planning_date", { ascending: false });
    if (error) setMessage(`Gagal memuat Monitoring: ${error.message}`);
    else {
      const nextRows = (data || []) as MonitoringRow[];
      setRows(nextRows);
      if (nextRows.length) {
        const dates = nextRows.map(x => x.planning_date).sort();
        setStartDate(dates[0]);
        setEndDate(dates[dates.length - 1]);
      }
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  const nameOf = (list: MasterRow[], id: string | null) => list.find(x => x.id === id)?.name || "—";
  const filtered = useMemo(() => rows.filter(r =>
    (!startDate || r.planning_date >= startDate) &&
    (!endDate || r.planning_date <= endDate) &&
    (branchId === "all" || r.branch_id === branchId) &&
    (selectedMT === "all" || r.mt_id === selectedMT) &&
    `${nameOf(mts, r.mt_id)} ${nameOf(rombels, r.rombel_id)} ${nameOf(mapels, r.mapel_id)} ${r.jenis_sesi}`.toLowerCase().includes(search.toLowerCase())
  ), [rows, mts, rombels, mapels, branchId, selectedMT, startDate, endDate, search]);

  const adminDone = (r: MonitoringRow) => ADMIN_KEYS.filter(k => Boolean(r[k])).length + (r.auvi_tv_status ? 1 : 0) + (r.ld_status ? 1 : 0);
  const adminTotal = ADMIN_KEYS.length + 2;
  const adminPercent = (r: MonitoringRow) => Math.round((adminDone(r) / adminTotal) * 100);
  const avgAdmin = filtered.length ? Math.round(filtered.reduce((a, r) => a + adminPercent(r), 0) / filtered.length) : 0;
  const completeCount = filtered.filter(r => adminDone(r) === adminTotal).length;
  const incompleteRows = filtered.filter(r => adminDone(r) < adminTotal);
  const incompleteCount = incompleteRows.length;

  const waReport = useMemo(() => {
    const byMt = new Map<string, MonitoringRow[]>();
    incompleteRows.forEach(row => {
      const key = row.mt_id || "unknown";
      if (!byMt.has(key)) byMt.set(key, []);
      byMt.get(key)!.push(row);
    });
    const lines: string[] = [
      "📋 *REPORT KELENGKAPAN ADMINISTRASI MT*",
      `📅 Periode: ${startDate ? formatDate(startDate) : "—"} s.d. ${endDate ? formatDate(endDate) : "—"}`,
      `📊 ${completeCount} sesi lengkap · ${incompleteCount} sesi belum lengkap`,
      "",
    ];
    if (!incompleteRows.length) {
      lines.push("🎉 *Semua sesi sudah lengkap!*", "Terima kasih, teman-teman MT Coach 🙌");
      return lines.join("\n");
    }
    lines.push("Mohon segera dilengkapi administrasinya ya. Berikut sesi yang masih belum lengkap:", "");
    let number = 1;
    Array.from(byMt.entries()).sort((a, b) => nameOf(mts, a[0]).localeCompare(nameOf(mts, b[0]))).forEach(([mtId, mtRows]) => {
      lines.push(`*${nameOf(mts, mtId)}*`);
      mtRows.sort((a, b) => a.planning_date.localeCompare(b.planning_date)).forEach(row => {
        const missing = [
          !row.topik_sub_topik_done && "Topik/Subtopik",
          !row.attendance && "Attendance",
          !row.starchamps && "Starchamps",
          !row.activity_score && "Activity Score",
          !row.report_sessions && "Report Sessions",
          !row.foto_kbm && "Foto KBM",
          !row.report_wa && "Report WA",
          !row.auvi_tv_status && "AuVi TV",
          !row.ld_status && "LD",
        ].filter(Boolean) as string[];
        lines.push(`${number++}. ${formatDate(row.planning_date)} · ${nameOf(branches, row.branch_id)}`, `   ${nameOf(rombels, row.rombel_id)} · ${nameOf(mapels, row.mapel_id)} · ${row.jenis_sesi}`, `   ❌ Belum: ${missing.join(", ")}`);
      });
      lines.push("");
    });
    lines.push("Terima kasih 🙏");
    return lines.join("\n");
  }, [incompleteRows, startDate, endDate, completeCount, incompleteCount, mts, branches, rombels, mapels]);

  async function copyWaReport() {
    try {
      await navigator.clipboard.writeText(waReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("Tidak bisa menyalin otomatis. Silakan blok teks laporan lalu copy.");
    }
  }

  function openWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(waReport)}`, "_blank", "noopener,noreferrer");
  }

  async function saveRow(row: MonitoringRow, patch: Partial<MonitoringRow>) {
    setSaving(row.id); setMessage("");
    const { error } = await supabase.from("weekly_planning").update(patch as never).eq("id", row.id).eq("status", "Finalized");
    if (error) setMessage(`Gagal menyimpan: ${error.message}`);
    else setRows(prev => prev.map(x => x.id === row.id ? { ...x, ...patch } : x));
    setSaving(null);
  }

  function clearDates() {
    if (!rows.length) return;
    const dates = rows.map(x => x.planning_date).sort();
    setStartDate(dates[0]); setEndDate(dates[dates.length - 1]);
  }

  const checkboxItems = [
    ["topik_sub_topik_done", "Topik/Subtopik"], ["attendance", "Attendance"], ["starchamps", "Starchamps"],
    ["activity_score", "Activity Score"], ["report_sessions", "Report Sessions"], ["foto_kbm", "Foto KBM"], ["report_wa", "Report WA"],
  ] as const;

  return <div className="page-wrap">
    <style>{`.wa-report-btn{white-space:nowrap}.wa-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.48);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:1000}.wa-modal{width:min(760px,100%);max-height:90vh;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:20px;box-shadow:0 24px 70px rgba(15,23,42,.22);padding:22px}.wa-modal-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.wa-modal-head h2{margin:5px 0 5px;font-size:20px}.wa-modal-head p{margin:0;color:#64748b;font-size:12px}.wa-close{width:34px;height:34px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:24px;line-height:1;cursor:pointer}.wa-report-summary{display:flex;gap:8px;margin:18px 0 10px}.wa-report-text{width:100%;min-height:360px;resize:vertical;border:1px solid #d8dee8;border-radius:12px;background:#f8fafc;padding:14px;font:13px/1.55 Inter,Arial,sans-serif;color:#172033;outline:none}.wa-report-text:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(37,99,235,.08)}.wa-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}.wa-modal-note{color:#94a3b8;font-size:11px;text-align:right;margin-top:8px}@media(max-width:700px){.monitoring-summary{justify-content:flex-start}.wa-report-btn{width:100%}.wa-modal{padding:16px}.wa-modal-actions{flex-direction:column}.wa-modal-actions button{width:100%}}`}</style>
    <section className="planning-hero">
      <div className="planning-hero-row"><div><div className="eyebrow">MT COACH · OPERATIONS</div><h1>Monitoring</h1><p>Sesi yang sudah Finalize dari Weekly Planning muncul di sini untuk dilengkapi administrasinya.</p></div><span className="badge planning-status">🔒 {filtered.length} sesi Finalized</span></div>
    </section>

    <section className="planning-control-card">
      <div className="control-box"><span className="control-label">Tanggal Awal</span><input className="date-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
      <div className="control-box"><span className="control-label">Tanggal Akhir</span><input className="date-input" type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} /></div>
      <div className="control-box"><span className="control-label">Cabang</span><select className="branch-select" value={branchId} onChange={e => setBranchId(e.target.value)}><option value="all">Semua Cabang</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div className="control-box"><span className="control-label">MT</span><select className="branch-select" value={selectedMT} onChange={e => setSelectedMT(e.target.value)}><option value="all">Semua MT</option>{mts.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="control-box"><span className="control-label">Cari</span><input className="date-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="MT / rombel / mapel..." /></div>
      <button type="button" className="secondary-btn" onClick={clearDates}>↻ Reset Tanggal</button>
    </section>

    <div className="grid planning-kpis">
      <div className="card planning-kpi"><div className="kpi-label">Finalized Session</div><div className="kpi-value">{filtered.length}</div><div className="kpi-note">Sesi siap dimonitor</div></div>
      <div className="card planning-kpi"><div className="kpi-label">Admin Completion</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">Rata-rata 9 item administrasi</div></div>
      <div className="card planning-kpi"><div className="kpi-label">Lengkap</div><div className="kpi-value">{completeCount}</div><div className="kpi-note">Semua 9 administrasi selesai</div></div>
    </div>

    {message && <div className="card" style={{ marginBottom: 16, padding: 14 }}>{message}</div>}

    <section className="card monitoring-card-list">
      <div className="planning-table-head monitoring-list-head"><div><h2>📊 Kelengkapan Administrasi</h2><p>MT Coach melengkapi administrasi untuk setiap sesi yang sudah Finalized.</p></div><div className="monitoring-summary"><span className="badge green">✅ {completeCount} Lengkap</span><span className="badge yellow">🟡 {incompleteCount} Belum lengkap</span><button type="button" className="primary-btn wa-report-btn" onClick={() => { setCopied(false); setShowWaReport(true); }}>📲 Generate Report WA</button></div></div>

      <div className="monitoring-cards">
        {loading ? <div className="empty-state"><strong>Memuat data…</strong></div> : filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">📋</div><strong>Belum ada sesi Finalized</strong><p>Sesuaikan tanggal atau filter untuk melihat sesi.</p></div> : filtered.map(row => {
          const done = adminDone(row); const complete = done === adminTotal; const open = openId === row.id;
          return <article key={row.id} className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"}`}>
            <button type="button" className="monitoring-card-header" onClick={() => setOpenId(open ? null : row.id)} aria-expanded={open}>
              <div className="monitoring-session-info"><div className="monitoring-mt"><span className="monitoring-status-dot">{complete ? "✓" : "!"}</span>{nameOf(mts, row.mt_id)}</div><div className="monitoring-meta">{formatDate(row.planning_date)} · {nameOf(branches, row.branch_id)}</div><div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · {row.jenis_sesi}</div></div>
              <div className="monitoring-card-status"><span className={`monitoring-status ${complete ? "complete" : "incomplete"}`}>{complete ? "✅ Lengkap" : "🟡 Belum lengkap"}</span><strong>{done}/{adminTotal}</strong><span className="monitoring-chevron">{open ? "⌃" : "⌄"}</span></div>
            </button>

            {open && <div className="monitoring-card-body">
              <div className="monitoring-admin-title">KELENGKAPAN ADMINISTRASI <span>{done}/{adminTotal} selesai</span></div>
              <div className="monitoring-admin-grid">
                {checkboxItems.map(([key, label]) => <label key={key} className={`admin-item ${row[key] ? "done" : "todo"}`}><input type="checkbox" checked={row[key]} disabled={saving === row.id} onChange={e => saveRow(row, { [key]: e.target.checked })} /><span>{label}</span><b>{row[key] ? "✓" : "—"}</b></label>)}
                <label className={`admin-item select-item ${row.auvi_tv_status ? "done" : "todo"}`}><span>📺 AuVi TV</span><select className="select monitoring-select" value={row.auvi_tv_status} disabled={saving === row.id} onChange={e => saveRow(row, { auvi_tv_status: e.target.value })}>{AUVISTATUSES.map(x => <option key={x}>{x}</option>)}</select></label>
                <label className={`admin-item select-item ${row.ld_status ? "done" : "todo"}`}><span>👥 LD</span><select className="select monitoring-select" value={row.ld_status} disabled={saving === row.id} onChange={e => saveRow(row, { ld_status: e.target.value })}>{LDSTATUSES.map(x => <option key={x}>{x}</option>)}</select></label>
              </div>
              <div className="monitoring-save-note">{saving === row.id ? "Menyimpan perubahan…" : "Perubahan tersimpan otomatis ke shared database."}</div>
            </div>}
          </article>;
        })}
      </div>
    </section>

    <div className="finalize-bar"><div><strong>Monitoring tersimpan otomatis</strong><small>Administrasi dapat dilengkapi kapan saja setelah sesi Finalized.</small></div><div style={{ display: "flex", gap: 10 }}><Link className="secondary-btn" href="/planning">📅 Kembali ke Planning</Link></div></div>

    {showWaReport && <div className="wa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowWaReport(false); }}>
      <section className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="wa-report-title">
        <div className="wa-modal-head"><div><div className="eyebrow">MONITORING · WHATSAPP</div><h2 id="wa-report-title">📲 Report Administrasi MT</h2><p>Generate pesan berdasarkan filter tanggal, cabang, MT, dan pencarian yang sedang aktif.</p></div><button type="button" className="wa-close" onClick={() => setShowWaReport(false)} aria-label="Tutup">×</button></div>
        <div className="wa-report-summary"><span className="badge green">✅ {completeCount} Lengkap</span><span className="badge yellow">🟡 {incompleteCount} Belum lengkap</span></div>
        <textarea className="wa-report-text" value={waReport} readOnly aria-label="Preview report WhatsApp" />
        <div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={copyWaReport}>{copied ? "✅ Tersalin!" : "📋 Copy Pesan"}</button><button type="button" className="primary-btn" onClick={openWhatsApp}>💬 Buka WhatsApp</button></div>
        <div className="wa-modal-note">WhatsApp akan dibuka dengan pesan sudah terisi. Pilih grup WA MT lalu kirim.</div>
      </section>
    </div>}
  </div>;
}
