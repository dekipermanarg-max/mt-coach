"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMTs, getSessions, MT, Session } from "../../lib/store";

export default function Performance() {
  const [mts, setMts] = useState<MT[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => { setMts(getMTs().filter((mt) => mt.status === "Active")); setSessions(getSessions()); }, []);

  const rows = useMemo(() => mts.map((mt) => {
    const own = sessions.filter((s) => s.mt === mt.name);
    const planned = own.length;
    const realized = own.filter((s) => s.status === "Realized").length;
    const session = planned ? Math.round(realized / planned * 100) : 0;
    return { name: mt.name, session, admin: null as number | null, overall: null as number | null, ld: null as number | null };
  }).sort((a, b) => b.session - a.session), [mts, sessions]);

  const avgSession = rows.length ? (rows.reduce((sum, r) => sum + r.session, 0) / rows.length).toFixed(1) : "0.0";
  const top = rows[0];
  const attention = rows.filter((r) => r.session < 90).length;

  return (
    <div className="shell">
      <aside className="sidebar"><div className="brand">MT Coach<span>BAC · Internal</span></div><nav className="nav"><Link href="/">🏠 Dashboard</Link><Link href="/planning">📅 Planning</Link><Link href="/monitoring">📊 Monitoring</Link><Link className="active" href="/performance">🏆 Performance</Link><Link href="/data">⚙️ Data</Link></nav></aside>
      <main className="main"><div className="page-wrap">
        <header className="page-head"><div><h1>MT Performance</h1><p>Performance berdasarkan session yang tercatat.</p></div><div className="filters"><select className="select" defaultValue="week36"><option value="week36">Week 36</option><option value="week35">Week 35</option></select><select className="select" defaultValue="tarandam"><option>Tarandam</option><option>Semua Cabang</option></select></div></header>
        <section className="grid"><div className="card"><div className="kpi-label">Average Session</div><div className="kpi-value">{avgSession}%</div><div className="kpi-note">{rows.length} MT aktif</div></div><div className="card"><div className="kpi-label">Top MT</div><div className="kpi-value">{top ? `${top.session}%` : "—"}</div><div className="kpi-note">{top?.name ?? "Belum ada data"}</div></div><div className="card"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{attention}</div><div className="kpi-note">Session completion &lt; 90%</div></div><div className="card"><div className="kpi-label">LD</div><div className="kpi-value">—</div><div className="kpi-note">Belum ada data LD</div></div></section>
        <section className="section"><div className="section-head"><h2>🏆 Ranking MT</h2><button className="secondary-btn" type="button">⬇️ Export</button></div><div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Session</th><th>Admin</th><th>Overall</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name}><td>{i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}</td><td><strong>{r.name}</strong></td><td>{r.session}%</td><td>—</td><td className="score">—</td><td>—</td><td><span className={`badge ${r.session >= 95 ? "green" : r.session >= 90 ? "blue" : "yellow"}`}>{r.session >= 95 ? "Excellent" : r.session >= 90 ? "Good" : "Attention"}</span></td></tr>)}</tbody></table></div></section>
        <section className="section"><div className="section-head"><h2>⚠️ Needs Attention</h2></div><div className="attention">{rows.filter((r) => r.session < 90).map((r) => <div className="alert" key={r.name}><div><strong>{r.name} · {r.session}%</strong><small>Session completion di bawah 90%</small></div><span className="badge yellow">Attention</span></div>)}{attention === 0 && <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan.</small></div></div>}</div></section>
        <section className="section"><div className="section-head"><h2>📐 Cara Hitung</h2></div><div className="card"><strong>Session Completion = Realized ÷ Planned × 100</strong><div className="kpi-note">Admin dan LD belum dimasukkan ke score sampai datanya tersedia.</div></div></section>
      </div></main>
    </div>
  );
}
