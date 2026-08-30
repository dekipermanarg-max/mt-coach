"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMTs, getSessions, MT, Session } from "../lib/store";

export default function Home() {
  const [mts, setMts] = useState<MT[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => { setMts(getMTs()); setSessions(getSessions()); }, []);

  const activeMTs = mts.filter((mt) => mt.status === "Active");
  const planned = sessions.length;
  const realized = sessions.filter((s) => s.status === "Realized").length;
  const sessionCompletion = planned ? ((realized / planned) * 100).toFixed(1) : "0.0";

  const performance = useMemo(() => activeMTs.map((mt) => {
    const own = sessions.filter((s) => s.mt === mt.name);
    const p = own.length;
    const r = own.filter((s) => s.status === "Realized").length;
    const score = p ? Math.round(r / p * 100) : 0;
    return { name: mt.name, score, planned: p, realized: r };
  }).sort((a, b) => b.score - a.score).slice(0, 5), [activeMTs, sessions]);

  const attention = performance.filter((r) => r.score < 90);
  const todaySessions = sessions.slice(0, 4);

  return (
    <div className="shell">
      <aside className="sidebar"><div className="brand">MT Coach<span>BAC · Internal</span></div><nav className="nav"><Link className="active" href="/">🏠 Dashboard</Link><Link href="/planning">📅 Planning</Link><Link href="/monitoring">📊 Monitoring</Link><Link href="/performance">🏆 Performance</Link><Link href="/data">⚙️ Data</Link></nav></aside>
      <main className="main"><header className="topbar"><div className="title"><h1>Dashboard</h1><p>Week 36 · 31 Aug – 6 Sep 2026</p></div><div className="filters"><select className="select" defaultValue="week36"><option value="week36">Week 36</option><option value="week35">Week 35</option></select><select className="select" defaultValue="tarandam"><option value="tarandam">Tarandam</option><option value="all">Semua Cabang</option></select></div></header>
        <section className="grid"><div className="card"><div className="kpi-label">Session Completion</div><div className="kpi-value">{sessionCompletion}%</div><div className="kpi-note">{realized} / {planned} realized</div></div><div className="card"><div className="kpi-label">Admin Completion</div><div className="kpi-value">—</div><div className="kpi-note">Belum ada data admin</div></div><div className="card"><div className="kpi-label">LD</div><div className="kpi-value">—</div><div className="kpi-note">Belum ada data LD</div></div><div className="card"><div className="kpi-label">Active MT</div><div className="kpi-value">{activeMTs.length}</div><div className="kpi-note">Data aktif</div></div></section>
        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{attention.length > 0 ? attention.map((r) => <div className="alert" key={r.name}><div><strong>{r.name}</strong><small>Session completion {r.score}% · {r.planned - r.realized} sesi belum realized</small></div><Link className="badge yellow" href="/performance">Lihat MT →</Link></div>) : <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT dengan session completion di bawah 90%.</small></div></div>}{sessions.filter(s => s.status === "Changed").length > 0 && <div className="alert"><div><strong>{sessions.filter(s => s.status === "Changed").length} sesi changed</strong><small>Ada sesi yang mengalami perubahan.</small></div><Link className="badge yellow" href="/monitoring">Lihat Sesi →</Link></div>}</div></section>
        <section className="section"><div className="section-head"><h2>🏆 MT Performance</h2><span className="kpi-note">Top 5</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Session</th><th>Realized</th><th>Overall</th><th>Status</th></tr></thead><tbody>{performance.map((r, i) => <tr key={r.name}><td>{i + 1}</td><td><strong>{r.name}</strong></td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.score}%</td><td><span className={`badge ${r.score >= 95 ? "green" : r.score >= 90 ? "blue" : "yellow"}`}>{r.score >= 95 ? "Excellent" : r.score >= 90 ? "Good" : "Attention"}</span></td></tr>)}</tbody></table></div></section>
        <section className="section"><div className="section-head"><h2>📅 Today</h2><Link className="kpi-note" href="/planning">Lihat Planning →</Link></div><div className="today">{todaySessions.length ? todaySessions.map((s) => <div className="session" key={s.id}><strong>{s.time} · {s.mt}</strong><span>{s.rombel}</span><br/><span className={`badge ${s.status === "Realized" ? "green" : s.status === "Changed" ? "yellow" : s.status === "Cancelled" ? "red" : "blue"}`}>{s.status}</span></div>) : <div className="alert"><div><strong>Belum ada sesi</strong><small>Tambahkan sesi melalui Planning.</small></div></div>}</div></section>
      </main>
    </div>
  );
}
