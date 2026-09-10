"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type MasterRow = { id: string; name: string; branch_id?: string | null; active?: boolean; status?: string };
type SessionRow = {
  id: string; planning_date: string; branch_id: string; mt_id: string | null; rombel_id: string | null;
  jenis_sesi: string; status?: string | null; auvi_tv: boolean; ld: boolean;
  auvi_tv_status: string | null; ld_status: string | null; attendance: boolean;
  topik_sub_topik_done: boolean; starchamps: boolean; activity_score: boolean;
  report_sessions: boolean; foto_kbm: boolean; report_wa: boolean;
};

const AUVI_WEEKLY_TARGET_PERCENT = 50;
const LD_WEEKLY_TARGET = 10;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

function isSimpleSession(s: SessionRow) {
  return s.jenis_sesi === "Klinik PR" || s.jenis_sesi === "Trial Class";
}

function adminComplete(s: SessionRow) {
  if (isSimpleSession(s)) return Boolean(s.attendance);
  return Boolean(
    s.topik_sub_topik_done &&
    s.attendance &&
    s.starchamps &&
    s.activity_score &&
    s.report_sessions &&
    s.foto_kbm &&
    s.report_wa &&
    s.auvi_tv_status &&
    (s.ld_status === "Bukan sesi LD" || s.ld_status === "Sudah report di CMS")
  );
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [mts, setMts] = useState<MasterRow[]>([]);
  const [rombels, setRombels] = useState<MasterRow[]>([]);
  const [branches, setBranches] = useState<MasterRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [branch, setBranch] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const startDate = defaultStart();
      const endDate = new Date().toISOString().slice(0, 10);
      const [b, mt, r, s] = await Promise.all([
        supabase.from("branches").select("id,name,active").eq("active", true).order("name"),
        supabase.from("master_mt").select("id,name,branch_id,active").eq("active", true).order("name"),
        supabase.from("master_rombel").select("id,name,branch_id,active").eq("active", true).order("name"),
        supabase.from("weekly_planning").select("id,planning_date,branch_id,mt_id,rombel_id,jenis_sesi,status,auvi_tv,ld,auvi_tv_status,ld_status,attendance,topik_sub_topik_done,starchamps,activity_score,report_sessions,foto_kbm,report_wa").eq("status", "Finalized").gte("planning_date", startDate).lte("planning_date", endDate).order("planning_date", { ascending: false }),
      ]);
      setBranches((b.data || []) as MasterRow[]);
      setMts((mt.data || []) as MasterRow[]);
      setRombels((r.data || []) as MasterRow[]);
      setSessions((s.data || []) as SessionRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const branchesList = useMemo(() => branches.filter(b => b.name !== "Semua Cabang"), [branches]);
  const visibleSessions = useMemo(() => branch === "all" ? sessions : sessions.filter(s => s.branch_id === branch), [sessions, branch]);
  const activeMTs = useMemo(() => branch === "all"
    ? mts.filter(m => m.active !== false)
    : mts.filter(m => m.active !== false && m.branch_id === branch), [mts, branch]);
  const branchRombels = useMemo(() => branch === "all" ? rombels : rombels.filter(r => r.branch_id === branch), [rombels, branch]);

  const planned = visibleSessions.length;
  const realized = visibleSessions.filter(s => s.attendance || s.status === "Realized").length;
  const sessionCompletion = planned ? ((realized / planned) * 100).toFixed(1) : "0.0";
  const auviRombels = new Set(visibleSessions.filter(s => s.auvi_tv_status === "Connect ke TV" || s.auvi_tv).map(s => s.rombel_id).filter(Boolean)).size;
  const auviCoverage = branchRombels.length ? Math.round((auviRombels / branchRombels.length) * 100) : 0;
  const ldCount = visibleSessions.filter(s => s.ld_status === "Sudah report di CMS" || s.ld).length;
  const auviTargetRombels = Math.ceil(branchRombels.length * AUVI_WEEKLY_TARGET_PERCENT / 100);

  const performance = useMemo(() => activeMTs.map(mt => {
    const own = visibleSessions.filter(s => s.mt_id === mt.id);
    const p = own.length;
    const complete = own.filter(adminComplete).length;
    const admin = p ? Math.round(complete / p * 100) : 0;
    return { id: mt.id, name: mt.name, admin, planned: p, complete };
  }).filter(r => r.planned > 0).sort((a, b) => b.admin - a.admin || b.planned - a.planned || b.complete - a.complete || a.name.localeCompare(b.name)).slice(0, 5), [activeMTs, visibleSessions]);

  const mtAttention = useMemo(() => performance.filter(r => r.admin < 90), [performance]);
  const changedCount = visibleSessions.filter(s => s.status === "Changed").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = visibleSessions.filter(s => s.planning_date === today).slice(0, 4);

  return (
    <div className="page-wrap dashboard-page">
      <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · OVERVIEW</div><h1>Dashboard</h1><p>Ringkasan planning, monitoring, dan performa MT Coach.</p></div><span className="badge planning-status">🏠 Overview</span></div></section>
      <div className="dashboard-filters"><select className="select" value={branch} onChange={e => setBranch(e.target.value)}><option value="all">Semua Cabang</option>{branchesList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      {loading ? <div className="card"><div className="kpi-note">Memuat data Monitoring...</div></div> : <>
        <section className="grid"><div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">{sessionCompletion}%</div><div className="kpi-note">{realized} / {planned} realized</div></div><div className="card"><div className="kpi-label">AuVi TV Weekly Target</div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">Target ≥ {AUVI_WEEKLY_TARGET_PERCENT}% unique rombel · {auviRombels}/{branchRombels.length}</div></div><div className="card"><div className="kpi-label">LD Weekly Target</div><div className="kpi-value">{ldCount} / {LD_WEEKLY_TARGET}</div><div className="kpi-note">Target {LD_WEEKLY_TARGET} sesi / minggu</div></div><div className="card"><div className="kpi-label">Active MT</div><div className="kpi-value">{activeMTs.length}</div><div className="kpi-note">{branch === "all" ? "Total semua cabang" : "MT dengan base di cabang ini"}</div></div></section>
        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div>
          <div className="grid attention-grid">
            <div className="card attention-card"><div className="section-head"><div><h3>👤 MT</h3><div className="kpi-note">Kelengkapan administrasi di bawah 90%</div></div><Link className="badge yellow" href="/performance">Lihat Performance →</Link></div>{mtAttention.length ? <div className="attention">{mtAttention.map(r => <div className="alert" key={r.id}><div><strong>{r.name}</strong><small>Admin {r.admin}% · {r.planned - r.complete} sesi belum lengkap</small></div></div>)}</div> : <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT dengan administrasi di bawah 90%.</small></div></div>}</div>
            <div className="card attention-card"><div className="section-head"><div><h3>📺 AuVi TV + LD</h3><div className="kpi-note">Assignment & administrasi yang perlu diperhatikan</div></div><Link className="badge yellow" href="/monitoring">Lihat Monitoring →</Link></div><div className="attention">{auviCoverage < AUVI_WEEKLY_TARGET_PERCENT && <div className="alert"><div><strong>📺 AuVi TV belum mencapai target</strong><small>{auviCoverage}% coverage · target ≥ {AUVI_WEEKLY_TARGET_PERCENT}% unique rombel ({auviRombels}/{branchRombels.length}).</small></div></div>}{ldCount < LD_WEEKLY_TARGET && <div className="alert"><div><strong>📝 LD belum mencapai target mingguan</strong><small>{ldCount}/{LD_WEEKLY_TARGET} sesi · target {LD_WEEKLY_TARGET} sesi per minggu.</small></div></div>}{!changedCount && auviCoverage >= AUVI_WEEKLY_TARGET_PERCENT && ldCount >= LD_WEEKLY_TARGET && <div className="alert"><div><strong>✅ All good</strong><small>AuVi TV dan LD sudah memenuhi target.</small></div></div>}{changedCount > 0 && <div className="alert"><div><strong>🔄 {changedCount} sesi changed</strong><small>Ada sesi yang mengalami perubahan.</small></div><Link className="badge yellow" href="/monitoring">Lihat Sesi →</Link></div>}</div></div>
          </div>
        </section>
        <section className="section"><div className="section-head"><div><h2>🏆 MT Performance</h2><div className="kpi-note">Top 5 · Ranking berdasarkan kelengkapan administrasi · 7 hari terakhir</div></div><Link className="kpi-note" href="/performance">Lihat semua →</Link></div><div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Finalized</th><th>Admin Lengkap</th><th>Admin</th><th>Status</th></tr></thead><tbody>{performance.map((r, i) => <tr key={r.id}><td>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td><td><strong>{r.name}</strong></td><td>{r.planned}</td><td>{r.complete}</td><td className="score">{r.admin}%</td><td><span className={`badge ${r.admin >= 95 ? "green" : r.admin >= 90 ? "blue" : r.admin >= 75 ? "yellow" : "red"}`}>{r.admin >= 95 ? "Excellent" : r.admin >= 90 ? "Good" : r.admin >= 75 ? "Attention" : "Critical"}</span></td></tr>)}</tbody></table></div></section>
        <section className="section"><div className="section-head"><h2>📅 Today</h2><Link className="kpi-note" href="/planning">Lihat Planning →</Link></div><div className="today">{todaySessions.length ? todaySessions.map(s => <div className="session" key={s.id}><strong>{formatDate(s.planning_date)}</strong><span>{mts.find(m => m.id === s.mt_id)?.name || "—"}</span><br/><span className={`badge ${s.attendance || s.status === "Realized" ? "green" : s.status === "Changed" ? "yellow" : s.status === "Cancelled" ? "red" : "blue"}`}>{s.status || "Finalized"}</span></div>) : <div className="alert"><div><strong>Belum ada sesi</strong><small>Belum ada sesi Finalized pada hari ini.</small></div></div>}</div></section>
      </>}
      <style jsx global>{`.dashboard-page{padding-top:0}.dashboard-filters{display:flex;justify-content:flex-end;margin-bottom:18px}.dashboard-filters .select{min-width:250px}.attention-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.attention-card{min-width:0}.attention-card h3{margin:0 0 4px}.attention-card .section-head{align-items:flex-start}@media(max-width:900px){.attention-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
