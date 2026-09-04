"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type MT = { id: string; name: string; branch_id: string | null };
type Branch = { id: string; name: string };
type Session = {
  id: string; planning_date: string; branch_id: string; mt_id: string | null; jenis_sesi: string;
  attendance: boolean; topik_sub_topik_done: boolean; starchamps: boolean; activity_score: boolean;
  report_sessions: boolean; foto_kbm: boolean; report_wa: boolean; auvi_tv_status: string | null; ld_status: string | null;
};
const AUVI_WEEKLY_TARGET = 10;
const LD_ELIGIBLE_ROMBEL: Record<string, number> = {
  "Padang - Ujung Gurun": 2, "Padang - Tarandam": 6, "Padang - Sutomo": 11, "Padang - S. Parman": 6, "Padang - Gajah Mada": 10,
  "Solok - Pandan": 6, "Payakumbuh - Simpang Benteng": 9, "Painan - Pagaruyung": 6, "Bukittinggi - Manggis Ganting": 5, "Bukittinggi - Jambu Air": 6
};
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""; }
function defaultStart() { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }
function adminCount(s: Session) { let count = 0; if (s.topik_sub_topik_done) count++; if (s.attendance) count++; if (s.starchamps) count++; if (s.activity_score) count++; if (s.report_sessions) count++; if (s.foto_kbm) count++; if (s.report_wa) count++; if (s.auvi_tv_status) count++; if (s.ld_status) count++; return count; }
function getBranchTargetKey(name: string) {
  const normalized = name.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  return Object.keys(LD_ELIGIBLE_ROMBEL).find(key => normalized === key.toLowerCase()) || null;
}
function weeksInRange(start: string, end: string) { const a = new Date(`${start}T00:00:00`); const b = new Date(`${end}T00:00:00`); const days = Math.max(1, Math.floor((b.getTime() - a.getTime()) / 86400000) + 1); return Math.max(1, Math.ceil(days / 7)); }

type ExportRow = { name: string; base: string; planned: number; realized: number; session: number; admin: number; ld: number | null };

export default function Performance() {
  const [mts, setMts] = useState<MT[]>([]); const [branches, setBranches] = useState<Branch[]>([]); const [sessions, setSessions] = useState<Session[]>([]);
  const [branch, setBranch] = useState("Semua Cabang"); const [startDate, setStartDate] = useState(defaultStart()); const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [exporting, setExporting] = useState(false); const [exportMessage, setExportMessage] = useState("");
  useEffect(() => { async function load() { setLoading(true); setError(""); const [mtRes, branchRes, sessionRes] = await Promise.all([
    supabase.from("master_mt").select("id,name,branch_id").eq("active", true).order("name"), supabase.from("branches").select("id,name").eq("active", true).order("name"),
    supabase.from("weekly_planning").select("id,planning_date,branch_id,mt_id,jenis_sesi,attendance,topik_sub_topik_done,starchamps,activity_score,report_sessions,foto_kbm,report_wa,auvi_tv_status,ld_status").eq("status", "Finalized").gte("planning_date", startDate).lte("planning_date", endDate).order("planning_date", { ascending: false })
  ]); if (mtRes.error || branchRes.error || sessionRes.error) setError(mtRes.error?.message || branchRes.error?.message || sessionRes.error?.message || "Gagal memuat data Performance."); setMts((mtRes.data || []) as MT[]); setBranches((branchRes.data || []) as Branch[]); setSessions((sessionRes.data || []) as Session[]); setLoading(false); } load(); }, [startDate, endDate]);
  const branchId = useMemo(() => branch === "Semua Cabang" ? null : (branches.find(b => b.name === branch)?.id || null), [branch, branches]);
  const branchName = (id: string | null) => branches.find(b => b.id === id)?.name || "—";
  const filtered = useMemo(() => sessions.filter(s => !branchId || s.branch_id === branchId), [sessions, branchId]);
  const selectedBranchCount = branch === "Semua Cabang" ? branches.filter(b => getBranchTargetKey(b.name)).length : 1;
  const periodWeeks = weeksInRange(startDate, endDate);
  const auviTarget = AUVI_WEEKLY_TARGET * selectedBranchCount * periodWeeks;
  const auviRealized = filtered.filter(s => s.auvi_tv_status && s.auvi_tv_status !== "Bukan sesi AuVi TV").length;
  const auviPct = auviTarget ? Math.round(auviRealized / auviTarget * 100) : 0;
  const selectedBranchKey = branch === "Semua Cabang" ? null : getBranchTargetKey(branch);
  const ldEligible = branch === "Semua Cabang" ? Object.values(LD_ELIGIBLE_ROMBEL).reduce((a, b) => a + b, 0) : (selectedBranchKey ? LD_ELIGIBLE_ROMBEL[selectedBranchKey] : 0);
  const ldTarget = branch === "Semua Cabang" ? Object.values(LD_ELIGIBLE_ROMBEL).reduce((a, b) => a + Math.ceil(b * 0.5), 0) * periodWeeks : Math.ceil(ldEligible * 0.5) * periodWeeks;
  const ldRombels = new Set(filtered.filter(s => s.ld_status && s.ld_status !== "Bukan sesi LD").map(s => s.id));
  const rows: ExportRow[] = useMemo(() => mts.map(mt => { const own = filtered.filter(s => s.mt_id === mt.id); const planned = own.length; const realized = own.filter(s => s.attendance).length; const session = planned ? Math.round(realized / planned * 100) : 0; const admin = planned ? Math.round(own.reduce((sum, s) => sum + adminCount(s), 0) / planned / 9 * 100) : 0; const ldOwn = own.filter(s => s.ld_status && s.ld_status !== "Bukan sesi LD"); const ld = ldOwn.length ? Math.round(ldOwn.filter(s => s.ld_status === "Sudah report di CMS").length / ldOwn.length * 100) : null; return { name: mt.name, base: branchName(mt.branch_id), planned, realized, session, admin, ld }; }).filter(r => r.planned > 0).sort((a, b) => b.session - a.session || b.admin - a.admin), [mts, filtered, branches]);
  const avgSession = rows.length ? (rows.reduce((sum, r) => sum + r.session, 0) / rows.length).toFixed(1) : "0.0"; const top = rows[0]; const attentionRows = rows.filter(r => r.session < 90 || r.admin < 90); const attention = attentionRows.length; const plannedTotal = rows.reduce((sum, r) => sum + r.planned, 0); const realizedTotal = rows.reduce((sum, r) => sum + r.realized, 0);
  const status = (r: { session: number; admin: number }) => r.session >= 90 && r.admin >= 90 ? (r.session >= 95 && r.admin >= 95 ? "Excellent" : "Good") : (r.session < 50 || r.admin < 50 ? "Critical" : "Attention");

  async function handleExport() {
    setExporting(true); setExportMessage("");
    try {
      let scriptUrl = window.localStorage.getItem("MT_COACH_SLIDES_EXPORT_URL") || "";
      scriptUrl = window.prompt("Masukkan URL Web App Google Apps Script untuk export Google Slides:", scriptUrl) || "";
      if (!scriptUrl) { setExporting(false); return; }
      window.localStorage.setItem("MT_COACH_SLIDES_EXPORT_URL", scriptUrl.trim());
      const report = {
        title: "MT Performance",
        startDate, endDate, branch,
        avgSession, top: top || null, attention: attentionRows,
        plannedTotal, realizedTotal,
        auvi: { realized: auviRealized, target: auviTarget, pct: auviPct },
        ld: { realized: ldRombels.size, target: ldTarget, eligible: ldEligible },
        rows
      };
      const response = await fetch("/api/export-performance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scriptUrl: scriptUrl.trim(), report }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuat Google Slides.");
      setExportMessage(`✓ Google Slides berhasil dibuat. ${result.url ? "Membuka presentasi…" : ""}`);
      if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setExportMessage(`Export gagal: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setExporting(false); }
  }

  return <div className="performance-shell"><main className="performance-main"><div className="performance-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · ANALYTICS</div><h1>MT Performance</h1><p>Performance berdasarkan sesi Finalized dan kelengkapan administrasi dari Monitoring.</p></div><span className="badge planning-status">🏆 Performance</span></div></section>
    <div className="performance-filters"><label className="date-filter"><span>Tanggal Awal</span><input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} /></label><label className="date-filter"><span>Tanggal Akhir</span><input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} /></label><label className="branch-filter"><span>Cabang Sesi</span><select className="select" value={branch} onChange={e => setBranch(e.target.value)}><option>Semua Cabang</option>{branches.map(b => <option key={b.id}>{b.name}</option>)}</select></label></div>
    <div className="period-note">Menampilkan performance <strong>{formatDate(startDate)}</strong> sampai <strong>{formatDate(endDate)}</strong>. Filter cabang berdasarkan <strong>lokasi sesi mengajar</strong>.</div>
    {error && <div className="card error-note">Gagal memuat data: {error}</div>}{loading && <div className="card loading-note">Memuat data Performance dari shared database…</div>}
    <section className="performance-grid"><div className="card performance-kpi"><div className="kpi-label">Average Session</div><div className="kpi-value">{avgSession}%</div><div className="kpi-note">{rows.length} MT dengan sesi Finalized</div></div><div className="card performance-kpi"><div className="kpi-label">Top MT</div><div className="kpi-value">{top ? `${top.session}%` : "—"}</div><div className="kpi-note">{top?.name || "Belum ada data"}</div></div><div className="card performance-kpi"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{attention}</div><div className="kpi-note">Session atau Admin &lt; 90%</div></div><div className="card performance-kpi"><div className="kpi-label">Total Finalized</div><div className="kpi-value">{plannedTotal}</div><div className="kpi-note">{realizedTotal} sesi sudah Attendance</div></div></section>
    <section className="section target-section"><div className="section-head"><div><h2>🎯 Weekly Target</h2><p className="section-note">Target operasional berdasarkan cabang sesi dan periode yang dipilih.</p></div></div><div className="target-grid"><div className="card target-card"><div className="kpi-label">AuVi TV</div><div className="target-main"><strong>{auviRealized}</strong><span>/ {auviTarget} sesi</span></div><div className="target-progress"><div style={{width:`${Math.min(100,auviPct)}%`}} /></div><div className="kpi-note">Target <strong>10 sesi/cabang/minggu</strong> · {auviPct}% tercapai</div></div><div className="card target-card"><div className="kpi-label">LD</div><div className="target-main"><strong>{ldRombels.size}</strong><span>/ {ldTarget} rombel</span></div><div className="target-progress"><div style={{width:`${Math.min(100,ldTarget ? Math.round(ldRombels.size/ldTarget*100):0)}%`}} /></div><div className="kpi-note">Target 50% rombel eligible/minggu · eligible: {ldEligible} rombel</div></div></div></section>
    <section className="section"><div className="section-head"><div><h2>🏆 Ranking MT</h2><p className="section-note">Ranking berdasarkan MT. <strong>Base</strong> adalah cabang utama MT, sedangkan filter Cabang Sesi berdasarkan lokasi sesi mengajar.</p></div><button className="secondary-btn" type="button" onClick={handleExport} disabled={exporting}>{exporting ? "⏳ Membuat Slides..." : "⬇️ Export ke Google Slides"}</button></div>{exportMessage && <div className="card export-note">{exportMessage}</div>}<div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Base</th><th>Finalized</th><th>Attendance</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.name}><td>{i<3?["🥇","🥈","🥉"][i]:i+1}</td><td><strong>{r.name}</strong></td><td>{r.base}</td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.session}%</td><td>{r.admin}%</td><td>{r.ld===null?"—":`${r.ld}%`}</td><td><span className={`badge ${status(r)==="Excellent"?"green":status(r)==="Good"?"blue":status(r)==="Critical"?"red":"yellow"}`}>{status(r)}</span></td></tr>)}{rows.length===0&&!loading&&<tr><td colSpan={9}><div className="empty-state">Belum ada sesi Finalized untuk rentang tanggal dan cabang sesi ini.</div></td></tr>}</tbody></table></div></section>
    <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{attentionRows.map(r=><div className="alert" key={r.name}><div><strong>{r.name} · Session {r.session}% · Admin {r.admin}%</strong><small>{r.base} · Session atau administrasi di bawah 90%</small></div><span className={`badge ${status(r)==="Critical"?"red":"yellow"}`}>{status(r)}</span></div>)}{attention===0&&<div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan berdasarkan filter saat ini.</small></div></div>}</div></section>
    <section className="section status-legend"><div className="section-head"><div><h2>📊 Legenda Status</h2><p className="section-note">Status otomatis berdasarkan skor Performance.</p></div></div><div className="status-legend-grid"><div className="status-legend-item excellent"><b>🟢 Excellent</b><span>≥ 90% · Performa sangat baik</span></div><div className="status-legend-item good"><b>🔵 Good</b><span>75–89% · Baik, masih bisa ditingkatkan</span></div><div className="status-legend-item attention"><b>🟡 Attention</b><span>50–74% · Perlu diperhatikan</span></div><div className="status-legend-item critical"><b>🔴 Critical</b><span>&lt; 50% · Perlu coaching/intervensi</span></div><div className="status-legend-item nodata"><b>⚪ No Data</b><span>Tidak ada sesi pada periode terpilih</span></div></div></section>
    <section className="section"><div className="section-head"><h2>📐 Cara Hitung</h2></div><div className="card formula-card"><div><strong>Session = Attendance ÷ Finalized × 100</strong><div className="kpi-note">Admin = rata-rata 9 item administrasi dari Monitoring. LD = sesi LD yang sudah report CMS ÷ seluruh sesi LD.</div></div><div className="kpi-note">Sumber: shared database Supabase</div></div></section>
  </div></main><style jsx global>{`.performance-shell{min-height:100vh;background:#f6f7f9;color:#172033}.performance-main{padding:20px 24px 45px}.performance-wrap{max-width:1220px;margin:0 auto}.performance-filters{display:flex;justify-content:flex-end;align-items:flex-end;gap:10px;margin-bottom:6px}.date-filter,.branch-filter{display:flex;flex-direction:column;gap:5px}.date-filter span,.branch-filter span{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em}.date-filter input,.performance-filters .select{height:42px;background:#fff;border:1px solid #d8dee8;border-radius:9px;padding:10px 12px;font:inherit;color:#172033}.date-filter input{min-width:155px}.performance-filters .select{min-width:220px}.period-note{text-align:right;color:#64748b;font-size:12px;margin-bottom:18px}.period-note strong{color:#334155}.performance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.performance-kpi{min-height:125px}.performance-kpi:first-child{border-left:4px solid #2563eb}.performance-kpi:nth-child(2){border-left:4px solid #22c55e}.performance-kpi:nth-child(3){border-left:4px solid #f59e0b}.performance-kpi:nth-child(4){border-left:4px solid #8b5cf6}.section-note{margin:4px 0 0;color:#64748b;font-size:12px}.secondary-btn{background:#fff}.formula-card{display:flex;justify-content:space-between;align-items:center;gap:20px}.formula-card .kpi-note{margin:5px 0 0}.error-note,.loading-note,.export-note{margin-bottom:16px;padding:14px}.error-note{border-left:4px solid #ef4444}.loading-note{border-left:4px solid #2563eb}.export-note{border-left:4px solid #22c55e}.target-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.target-card{min-height:150px}.target-main{display:flex;align-items:baseline;gap:7px;margin:8px 0 10px}.target-main strong{font-size:30px}.target-main span{color:#64748b;font-size:13px}.target-progress{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:8px}.target-progress>div{height:100%;background:#2563eb;border-radius:999px;transition:width .2s ease}.target-card:nth-child(2) .target-progress>div{background:#22c55e}.status-legend-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.status-legend-item{display:flex;flex-direction:column;gap:5px;padding:13px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc}.status-legend-item b{font-size:12px}.status-legend-item span{font-size:10px;line-height:1.4;color:#64748b}.status-legend-item.excellent{border-left:3px solid #22c55e}.status-legend-item.good{border-left:3px solid #3b82f6}.status-legend-item.attention{border-left:3px solid #f59e0b}.status-legend-item.critical{border-left:3px solid #ef4444}.status-legend-item.nodata{border-left:3px solid #94a3b8}@media(max-width:900px){.performance-main{padding:18px 16px}.performance-filters{justify-content:stretch;flex-wrap:wrap}.date-filter,.branch-filter{flex:1;min-width:170px}.performance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.target-grid{grid-template-columns:1fr}.status-legend-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.performance-grid{grid-template-columns:1fr}.formula-card{align-items:flex-start;flex-direction:column}.performance-filters{flex-direction:column;align-items:stretch}.date-filter,.branch-filter{min-width:0}.period-note{text-align:left}.status-legend-grid{grid-template-columns:1fr}}`}</style></div>;
}
