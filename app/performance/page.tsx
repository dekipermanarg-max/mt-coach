"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type MasterRow = { id: string; name: string; branch_id?: string | null };
type MonitoringRow = {
  id: string;
  planning_date: string;
  branch_id: string;
  mt_id: string | null;
  jenis_sesi: string;
  attendance: boolean;
  topik_sub_topik_done: boolean;
  starchamps: boolean;
  activity_score: boolean;
  report_sessions: boolean;
  foto_kbm: boolean;
  report_wa: boolean;
  auvi_tv_status: string | null;
  ld_status: string | null;
};

const branches = ["Semua Cabang", "Bukittinggi - Jambu Air", "Bukittinggi - Manggis Ganting", "Painan - Pagaruyung", "Payakumbuh - Simpang Benteng", "Solok - Pandan", "Padang - Gajah Mada", "Padang - S. Parman", "Padang - Sutomo", "Padang - Tarandam", "Padang - Ujung Gurun"];
const ADMIN_KEYS = ["topik_sub_topik_done", "attendance", "starchamps", "activity_score", "report_sessions", "foto_kbm", "report_wa"] as const;

function formatDate(date: string) {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export default function Performance() {
  const [mts, setMts] = useState<MasterRow[]>([]);
  const [branchesRows, setBranchesRows] = useState<MasterRow[]>([]);
  const [sessions, setSessions] = useState<MonitoringRow[]>([]);
  const [branch, setBranch] = useState("Semua Cabang");
  const [startDate, setStartDate] = useState(defaultStart());
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const [mtRes, branchRes, sessionRes] = await Promise.all([
        supabase.from("master_mt").select("id,name,branch_id").eq("active", true).order("name"),
        supabase.from("branches").select("id,name").eq("active", true).order("name"),
        supabase.from("weekly_planning")
          .select("id,planning_date,branch_id,mt_id,jenis_sesi,attendance,topik_sub_topik_done,starchamps,activity_score,report_sessions,foto_kbm,report_wa,auvi_tv_status,ld_status")
          .eq("status", "Finalized")
          .gte("planning_date", startDate)
          .lte("planning_date", endDate)
          .order("planning_date", { ascending: false }),
      ]);
      if (mtRes.error || branchRes.error || sessionRes.error) {
        setError(mtRes.error?.message || branchRes.error?.message || sessionRes.error?.message || "Gagal memuat data Performance.");
      }
      setMts((mtRes.data || []) as MasterRow[]);
      setBranchesRows((branchRes.data || []) as MasterRow[]);
      setSessions((sessionRes.data || []) as MonitoringRow[]);
      setLoading(false);
    }
    load();
  }, [startDate, endDate]);

  const branchId = useMemo(() => branch === "Semua Cabang" ? null : branchesRows.find(b => b.name === branch)?.id || null, [branch, branchesRows]);
  const nameOf = (list: MasterRow[], id: string | null) => list.find(x => x.id === id)?.name || "—";

  const filteredSessions = useMemo(() => sessions.filter(s => !branchId || s.branch_id === branchId), [sessions, branchId]);

  const rows = useMemo(() => mts.map(mt => {
    const own = filteredSessions.filter(s => s.mt_id === mt.id);
    const planned = own.length;
    const realized = own.filter(s => s.attendance).length;
    const session = planned ? Math.round(realized / planned * 100) : 0;
    const adminValues = own.map(s => ADMIN_KEYS.filter(k => Boolean(s[k])).length + (s.auvi_tv_status ? 1 : 0) + (s.ld_status ? 1 : 0));
    const admin = planned ? Math.round(adminValues.reduce((a, n) => a + n, 0) / planned / 9 * 100) : null;
    const ldSessions = own.filter(s => Boolean(s.ld_status) && s.ld_status !== "Bukan sesi LD");
    const ld = ldSessions.length ? Math.round(ldSessions.filter(s => s.ld_status === "Sudah report di CMS").length / ldSessions.length * 100) : null;
    return { name: mt.name, branch: nameOf(branchesRows, mt.branch_id), session, planned, realized, admin, ld };
  }).filter(r => branch === "Semua Cabang" || r.branch === branch).filter(r => r.planned > 0).sort((a, b) => b.session - a.session || (b.admin ?? 0) - (a.admin ?? 0)), [mts, filteredSessions, branchesRows, branch]);

  const avgSession = rows.length ? (rows.reduce((sum, r) => sum + r.session, 0) / rows.length).toFixed(1) : "0.0";
  const avgAdmin = rows.length ? Math.round(rows.reduce((sum, r) => sum + (r.admin ?? 0), 0) / rows.length) : 0;
  const top = rows[0];
  const attention = rows.filter(r => r.session < 90 || (r.admin ?? 0) < 90).length;
  const plannedTotal = rows.reduce((sum, r) => sum + r.planned, 0);
  const realizedTotal = rows.reduce((sum, r) => sum + r.realized, 0);

  return (
    <div className="performance-shell">
      <main className="performance-main">
        <div className="performance-wrap">
          <section className="planning-hero">
            <div className="planning-hero-row">
              <div><div className="eyebrow">MT COACH · ANALYTICS</div><h1>MT Performance</h1><p>Performance berdasarkan sesi Finalized dan kelengkapan administrasi dari Monitoring.</p></div>
              <span className="badge planning-status">🏆 Performance</span>
            </div>
          </section>

          <div className="performance-filters">
            <label className="date-filter"><span>Tanggal Awal</span><input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} /></label>
            <label className="date-filter"><span>Tanggal Akhir</span><input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} /></label>
            <label className="branch-filter"><span>Cabang</span><select className="select" value={branch} onChange={e => setBranch(e.target.value)}>{branches.map(b => <option key={b}>{b}</option>)}</select></label>
          </div>
          <div className="period-note">Menampilkan performance <strong>{formatDate(startDate)}</strong> sampai <strong>{formatDate(endDate)}</strong>.</div>

          {error && <div className="card error-note">Gagal memuat data: {error}</div>}
          {loading && <div className="card loading-note">Memuat data Performance dari shared database…</div>}

          <section className="performance-grid">
            <div className="card performance-kpi"><div className="kpi-label">Average Session</div><div className="kpi-value">{avgSession}%</div><div className="kpi-note">{rows.length} MT aktif · berdasarkan Attendance</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Average Admin</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">9 item Monitoring per sesi</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{attention}</div><div className="kpi-note">Session atau Admin &lt; 90%</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Total Finalized</div><div className="kpi-value">{plannedTotal}</div><div className="kpi-note">{realizedTotal} sesi sudah Attendance</div></div>
          </section>

          <section className="section"><div className="section-head"><div><h2>🏆 Ranking MT</h2><p className="section-note">Ranking mengikuti filter cabang dan rentang tanggal. Data diambil dari sesi Finalized pada Monitoring.</p></div><button className="secondary-btn" type="button">⬇️ Export</button></div>
            <div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Cabang</th><th>Finalized</th><th>Attendance</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name}><td>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td><td><strong>{r.name}</strong></td><td>{r.branch}</td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.session}%</td><td>{r.admin === null ? "—" : `${r.admin}%`}</td><td>{r.ld === null ? "—" : `${r.ld}%`}</td><td><span className={`badge ${r.session >= 95 && (r.admin ?? 0) >= 95 ? "green" : r.session >= 90 && (r.admin ?? 0) >= 90 ? "blue" : "yellow"}`}>{r.session >= 95 && (r.admin ?? 0) >= 95 ? "Excellent" : r.session >= 90 && (r.admin ?? 0) >= 90 ? "Good" : "Attention"}</span></td></tr>)}{rows.length === 0 && !loading && <tr><td colSpan={9}><div className="empty-state">Belum ada sesi Finalized untuk rentang tanggal dan cabang ini.</div></td></tr>}</tbody></table></div>
          </section>

          <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{rows.filter(r => r.session < 90 || (r.admin ?? 0) < 90).map(r => <div className="alert" key={r.name}><div><strong>{r.name} · Session {r.session}% · Admin {r.admin ?? 0}%</strong><small>{r.branch} · Session atau kelengkapan administrasi di bawah 90%</small></div><span className="badge yellow">Attention</span></div>)}{attention === 0 && <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan berdasarkan filter saat ini.</small></div></div>}</div></section>

          <section className="section"><div className="section-head"><h2>📐 Cara Hitung</h2></div><div className="card formula-card"><div><strong>Session = Attendance ÷ Finalized × 100</strong><div className="kpi-note">Admin = rata-rata 9 item administrasi dari Monitoring. LD = sesi LD yang sudah report CMS ÷ seluruh sesi LD.</div></div><div className="kpi-note">Sumber: shared database Supabase</div></div></section>
        </div>
      </main>

      <style jsx global>{`
        .performance-shell{min-height:100vh;background:#f6f7f9;color:#172033}.performance-main{padding:20px 24px 45px}.performance-wrap{max-width:1220px;margin:0 auto}.performance-filters{display:flex;justify-content:flex-end;align-items:flex-end;gap:10px;margin-bottom:6px}.date-filter,.branch-filter{display:flex;flex-direction:column;gap:5px}.date-filter span,.branch-filter span{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em}.date-filter input,.performance-filters .select{height:42px;background:#fff;border:1px solid #d8dee8;border-radius:9px;padding:10px 12px;font:inherit;color:#172033}.date-filter input{min-width:155px}.performance-filters .select{min-width:220px}.period-note{text-align:right;color:#64748b;font-size:12px;margin-bottom:18px}.period-note strong{color:#334155}.performance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.performance-kpi{min-height:125px}.performance-kpi:first-child{border-left:4px solid #2563eb}.performance-kpi:nth-child(2){border-left:4px solid #22c55e}.performance-kpi:nth-child(3){border-left:4px solid #f59e0b}.performance-kpi:nth-child(4){border-left:4px solid #8b5cf6}.section-note{margin:4px 0 0;color:#64748b;font-size:12px}.secondary-btn{background:#fff}.formula-card{display:flex;justify-content:space-between;align-items:center;gap:20px}.formula-card .kpi-note{margin:5px 0 0}.error-note,.loading-note{margin-bottom:16px;padding:14px}.error-note{border-left:4px solid #ef4444}.loading-note{border-left:4px solid #2563eb}@media(max-width:900px){.performance-main{padding:18px 16px}.performance-filters{justify-content:stretch;flex-wrap:wrap}.date-filter,.branch-filter{flex:1;min-width:170px}.performance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.performance-grid{grid-template-columns:1fr}.formula-card{align-items:flex-start;flex-direction:column}.performance-filters{flex-direction:column;align-items:stretch}.date-filter,.branch-filter{min-width:0}.period-note{text-align:left}}
      `}</style>
    </div>
  );
}
