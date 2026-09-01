"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMTs, getRombels, getSessions, MT, Rombel, Session } from "../lib/store";

export default function Home() {
  const [mts, setMts] = useState<MT[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branch, setBranch] = useState("Tarandam");

  useEffect(() => { setMts(getMTs()); setRombels(getRombels()); setSessions(getSessions()); }, []);

  const branchMTs = branch === "all" ? mts : mts.filter((mt) => mt.branch === branch);
  const activeMTs = branchMTs.filter((mt) => mt.status === "Active");
  const branchRombels = branch === "all" ? rombels : rombels.filter((r) => r.branch === branch);
  const visibleSessions = branch === "all" ? sessions : sessions.filter((s) => {
    const mt = mts.find((m) => m.name === s.mt);
    const rombel = rombels.find((r) => r.name === s.rombel);
    return mt?.branch === branch || rombel?.branch === branch;
  });
  const planned = visibleSessions.length;
  const realized = visibleSessions.filter((s) => s.status === "Realized").length;
  const sessionCompletion = planned ? ((realized / planned) * 100).toFixed(1) : "0.0";
  const auviRombels = new Set(visibleSessions.filter((s) => s.auviTv && s.status !== "Cancelled").map((s) => s.rombel)).size;
  const auviCoverage = branchRombels.length ? Math.round((auviRombels / branchRombels.length) * 100) : 0;
  const ldCount = visibleSessions.filter((s) => s.ld && s.status !== "Cancelled").length;

  const performance = useMemo(() => activeMTs.map((mt) => {
    const own = visibleSessions.filter((s) => s.mt === mt.name);
    const p = own.length;
    const r = own.filter((s) => s.status === "Realized").length;
    const score = p ? Math.round(r / p * 100) : 0;
    return { name: mt.name, score, planned: p, realized: r };
  }).sort((a, b) => b.score - a.score).slice(0, 5), [activeMTs, visibleSessions]);

  const attention = performance.filter((r) => r.score < 90);
  const todaySessions = visibleSessions.slice(0, 4);

  return (
    <div className="page-wrap dashboard-page">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div><div className="eyebrow">MT COACH · OVERVIEW</div><h1>Dashboard</h1><p>Ringkasan planning, monitoring, dan performa MT Coach.</p></div>
          <span className="badge planning-status">🏠 Overview</span>
        </div>
      </section>
      <div className="dashboard-filters">
        <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}><option value="Tarandam">Tarandam</option><option value="all">Semua Cabang</option></select>
      </div>
      <section className="grid"><div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">{sessionCompletion}%</div><div className="kpi-note">{realized} / {planned} realized</div></div><div className="card"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">Target ≥ 50% rombel</div></div><div className="card"><div className="kpi-label">LD</div><div className="kpi-value">{ldCount}/10</div><div className="kpi-note">Target 10 sesi</div></div><div className="card"><div className="kpi-label">Active MT</div><div className="kpi-value">{activeMTs.length}</div><div className="kpi-note">Data aktif</div></div></section>
      <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{attention.length > 0 ? attention.map((r) => <div className="alert" key={r.name}><div><strong>{r.name}</strong><small>Session completion {r.score}% · {r.planned - r.realized} sesi belum realized</small></div><Link className="badge yellow" href="/performance">Lihat MT →</Link></div>) : <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT dengan session completion di bawah 90%.</small></div></div>}{visibleSessions.filter(s => s.status === "Changed").length > 0 && <div className="alert"><div><strong>{visibleSessions.filter(s => s.status === "Changed").length} sesi changed</strong><small>Ada sesi yang mengalami perubahan.</small></div><Link className="badge yellow" href="/monitoring">Lihat Sesi →</Link></div>}{auviCoverage < 50 && <div className="alert"><div><strong>AuVi TV belum mencapai target</strong><small>{auviCoverage}% coverage · target minimal 50% rombel.</small></div><Link className="badge yellow" href="/planning">Atur Assignment →</Link></div>}{ldCount < 10 && <div className="alert"><div><strong>LD belum mencapai target</strong><small>{ldCount}/10 sesi assigned.</small></div><Link className="badge yellow" href="/planning">Atur LD →</Link></div>}</div></section>
      <section className="section"><div className="section-head"><h2>🏆 MT Performance</h2><span className="kpi-note">Top 5</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Session</th><th>Realized</th><th>Overall</th><th>Status</th></tr></thead><tbody>{performance.map((r, i) => <tr key={r.name}><td>{i + 1}</td><td><strong>{r.name}</strong></td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.score}%</td><td><span className={`badge ${r.score >= 95 ? "green" : r.score >= 90 ? "blue" : "yellow"}`}>{r.score >= 95 ? "Excellent" : r.score >= 90 ? "Good" : "Attention"}</span></td></tr>)}</tbody></table></div></section>
      <section className="section"><div className="section-head"><h2>📅 Today</h2><Link className="kpi-note" href="/planning">Lihat Planning →</Link></div><div className="today">{todaySessions.length ? todaySessions.map((s) => <div className="session" key={s.id}><strong>{s.time} · {s.mt}</strong><span>{s.rombel}</span><br/><span className={`badge ${s.status === "Realized" ? "green" : s.status === "Changed" ? "yellow" : s.status === "Cancelled" ? "red" : "blue"}`}>{s.status}</span></div>) : <div className="alert"><div><strong>Belum ada sesi</strong><small>Tambahkan sesi melalui Planning.</small></div></div>}</div></section>
      <style jsx global>{`.dashboard-page{padding-top:0}.dashboard-filters{display:flex;justify-content:flex-end;margin-bottom:18px}.dashboard-filters .select{min-width:150px}`}</style>
    </div>
  );
}
