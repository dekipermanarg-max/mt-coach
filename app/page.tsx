"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type MasterRow = { id: string; name: string; branch_id?: string | null; active?: boolean; status?: string };
type SessionRow = {
  id: string; planning_date: string; branch_id: string; mt_id: string | null; rombel_id: string | null;
  jenis_sesi: string; status?: string | null; auvi_tv: boolean; ld: boolean;
  auvi_tv_status: string | null; ld_status: string | null; attendance: boolean;
};

const LD_TARGETS: Record<string, number> = {
  "Ujung Gurun": 1,
  "Tarandam": 3,
  "Sutomo": 6,
  "S. Parman": 1,
  "Gajah Mada": 5,
  "Solok": 3,
  "Payakumbuh": 5,
  "Painan": 3,
  "Manggis Ganting": 3,
  "Jambu Air": 3,
};
const LD_ELIGIBLE_ROMBELS: Record<string, number> = {
  "Ujung Gurun": 2,
  "Tarandam": 6,
  "Sutomo": 11,
  "S. Parman": 1,
  "Gajah Mada": 10,
  "Solok": 6,
  "Payakumbuh": 9,
  "Painan": 6,
  "Manggis Ganting": 5,
  "Jambu Air": 6,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
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
      const [b, mt, r, s] = await Promise.all([
        supabase.from("branches").select("id,name,active").eq("active", true).order("name"),
        supabase.from("master_mt").select("id,name,branch_id,active").eq("active", true).order("name"),
        supabase.from("master_rombel").select("id,name,branch_id,active").eq("active", true).order("name"),
        supabase.from("weekly_planning").select("id,planning_date,branch_id,mt_id,rombel_id,jenis_sesi,status,auvi_tv,ld,auvi_tv_status,ld_status,attendance").eq("status", "Finalized").order("planning_date", { ascending: false }),
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
  const activeMTs = useMemo(() => mts.filter(m => m.active !== false), [mts]);
  const branchRombels = useMemo(() => branch === "all" ? rombels : rombels.filter(r => r.branch_id === branch), [rombels, branch]);

  const planned = visibleSessions.length;
  const realized = visibleSessions.filter(s => s.attendance || s.status === "Realized").length;
  const sessionCompletion = planned ? ((realized / planned) * 100).toFixed(1) : "0.0";
  const auviRombels = new Set(visibleSessions.filter(s => s.auvi_tv_status === "Connect ke TV" || s.auvi_tv).map(s => s.rombel_id).filter(Boolean)).size;
  const auviCoverage = branchRombels.length ? Math.round((auviRombels / branchRombels.length) * 100) : 0;
  const ldCount = visibleSessions.filter(s => s.ld_status === "Sudah report di CMS" || s.ld).length;

  const ldTarget = useMemo(() => {
    if (branch !== "all") {
      const name = branches.find(b => b.id === branch)?.name;
      return name ? (LD_TARGETS[name] || 0) : 0;
    }
    return Object.values(LD_TARGETS).reduce((sum, value) => sum + value, 0);
  }, [branch, branches]);
  const ldEligible = useMemo(() => {
    if (branch !== "all") {
      const name = branches.find(b => b.id === branch)?.name;
      return name ? (LD_ELIGIBLE_ROMBELS[name] || 0) : 0;
    }
    return Object.values(LD_ELIGIBLE_ROMBELS).reduce((sum, value) => sum + value, 0);
  }, [branch, branches]);

  const performance = useMemo(() => activeMTs.map(mt => {
    const own = visibleSessions.filter(s => s.mt_id === mt.id);
    const p = own.length;
    const r = own.filter(s => s.attendance || s.status === "Realized").length;
    const score = p ? Math.round(r / p * 100) : 0;
    return { id: mt.id, name: mt.name, score, planned: p, realized: r };
  }).filter(r => r.planned > 0).sort((a, b) => b.score - a.score || b.realized - a.realized).slice(0, 5), [activeMTs, visibleSessions]);

  const mtAttention = useMemo(() => performance.filter(r => r.score < 90), [performance]);
  const changedCount = visibleSessions.filter(s => s.status === "Changed").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = visibleSessions.filter(s => s.planning_date === today).slice(0, 4);

  return (
    <div className="page-wrap dashboard-page">
      <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · OVERVIEW</div><h1>Dashboard</h1><p>Ringkasan planning, monitoring, dan performa MT Coach.</p></div><span className="badge planning-status">🏠 Overview</span></div></section>
      <div className="dashboard-filters"><select className="select" value={branch} onChange={e => setBranch(e.target.value)}><option value="all">Semua Cabang</option>{branchesList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      {loading ? <div className="card"><div className="kpi-note">Memuat data Monitoring...</div></div> : <>
        <section className="grid"><div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">{sessionCompletion}%</div><div className="kpi-note">{realized} / {planned} realized</div></div><div className="card"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">Target ≥ 50% rombel</div></div><div className="card"><div className="kpi-label">LD Weekly Target</div><div className="kpi-value">{ldTarget}</div><div className="kpi-note">{ldEligible} rombel eligible · target minimal 50%/minggu</div></div><div className="card"><div className="kpi-label">Active MT</div><div className="kpi-value">{activeMTs.length}</div><div className="kpi-note">Data aktif</div></div></section>

        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div>
          <div className="grid attention-grid">
            <div className="card attention-card">
              <div className="section-head"><div><h3>👤 MT</h3><div className="kpi-note">Session completion di bawah 90%</div></div><Link className="badge yellow" href="/performance">Lihat Performance →</Link></div>
              {mtAttention.length ? <div className="attention">{mtAttention.map(r => <div className="alert" key={r.id}><div><strong>{r.name}</strong><small>Session completion {r.score}% · {r.planned - r.realized} sesi belum realized</small></div></div>)}</div> : <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT dengan session completion di bawah 90%.</small></div></div>}
            </div>

            <div className="card attention-card">
              <div className="section-head"><div><h3>📺 AuVi TV + LD</h3><div className="kpi-note">Assignment & administrasi yang perlu diperhatikan</div></div><Link className="badge yellow" href="/monitoring">Lihat Monitoring →</Link></div>
              <div className="attention">
                {auviCoverage < 50 && <div className="alert"><div><strong>📺 AuVi TV belum mencapai target</strong><small>{auviCoverage}% coverage · target minimal 50% rombel.</small></div></div>}
                {ldCount < ldTarget && <div className="alert"><div><strong>📝 LD belum mencapai target mingguan</strong><small>{ldCount} sesi · target {ldTarget} rombel/minggu ({ldEligible} rombel eligible).</small></div></div>}
                {!changedCount && auviCoverage >= 50 && ldCount >= ldTarget && <div className="alert"><div><strong>✅ All good</strong><small>AuVi TV dan LD sudah memenuhi target.</small></div></div>}
                {changedCount > 0 && <div className="alert"><div><strong>🔄 {changedCount} sesi changed</strong><small>Ada sesi yang mengalami perubahan.</small></div><Link className="badge yellow" href="/monitoring">Lihat Sesi →</Link></div>}
              </div>
            </div>
          </div>
        </section>

        <section className="section"><div className="section-head"><h2>🏆 MT Performance</h2><span className="kpi-note">Top 5</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Session</th><th>Realized</th><th>Overall</th><th>Status</th></tr></thead><tbody>{performance.map((r, i) => <tr key={r.id}><td>{i + 1}</td><td><strong>{r.name}</strong></td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.score}%</td><td><span className={`badge ${r.score >= 95 ? "green" : r.score >= 90 ? "blue" : "yellow"}`}>{r.score >= 95 ? "Excellent" : r.score >= 90 ? "Good" : "Attention"}</span></td></tr>)}</tbody></table></div></section>
        <section className="section"><div className="section-head"><h2>📅 Today</h2><Link className="kpi-note" href="/planning">Lihat Planning →</Link></div><div className="today">{todaySessions.length ? todaySessions.map(s => <div className="session" key={s.id}><strong>{formatDate(s.planning_date)}</strong><span>{mts.find(m => m.id === s.mt_id)?.name || "—"}</span><br/><span className={`badge ${s.attendance || s.status === "Realized" ? "green" : s.status === "Changed" ? "yellow" : s.status === "Cancelled" ? "red" : "blue"}`}>{s.status || "Finalized"}</span></div>) : <div className="alert"><div><strong>Belum ada sesi</strong><small>Belum ada sesi Finalized pada hari ini.</small></div></div>}</div></section>
      </>}
      <style jsx global>{`.dashboard-page{padding-top:0}.dashboard-filters{display:flex;justify-content:flex-end;margin-bottom:18px}.dashboard-filters .select{min-width:250px}.attention-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.attention-card{min-width:0}.attention-card h3{margin:0 0 4px}.attention-card .section-head{align-items:flex-start}@media(max-width:900px){.attention-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}