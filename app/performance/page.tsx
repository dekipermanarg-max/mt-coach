"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMTs, getSessions, MT, Session } from "../../lib/store";

const branches = ["Semua Cabang", "Bukittinggi - Jambu Air", "Bukittinggi - Manggis Ganting", "Painan - Pagaruyung", "Payakumbuh - Simpang Benteng", "Solok - Pandan", "Padang - Gajah Mada", "Padang - S. Parman", "Padang - Sutomo", "Padang - Tarandam", "Padang - Ujung Gurun"];

function weekLabel(date = new Date()) {
  const first = new Date(date.getFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - first.getTime()) / 86400000);
  return `Week ${Math.ceil((day + first.getDay() + 1) / 7)}`;
}

export default function Performance() {
  const [mts, setMts] = useState<MT[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branch, setBranch] = useState("Semua Cabang");
  const [week, setWeek] = useState(weekLabel());

  useEffect(() => {
    setMts(getMTs().filter((mt) => mt.status === "Active"));
    setSessions(getSessions());
  }, []);

  const rows = useMemo(() => mts.map((mt) => {
    const own = sessions.filter((s) => s.mt === mt.name && (branch === "Semua Cabang" || mt.branch === branch));
    const planned = own.length;
    const realized = own.filter((s) => s.status === "Realized").length;
    const session = planned ? Math.round(realized / planned * 100) : 0;
    return { name: mt.name, branch: mt.branch, session, planned, realized, admin: null as number | null, overall: null as number | null, ld: null as number | null };
  }).filter((r) => branch === "Semua Cabang" || r.branch === branch).sort((a, b) => b.session - a.session), [mts, sessions, branch]);

  const avgSession = rows.length ? (rows.reduce((sum, r) => sum + r.session, 0) / rows.length).toFixed(1) : "0.0";
  const top = rows[0];
  const attention = rows.filter((r) => r.session < 90).length;

  return (
    <div className="performance-shell">
      <header className="topbar">
        <div className="topbar-brand">MT Coach <span>BAC · Internal</span></div>
        <nav className="topnav">
          <Link href="/">🏠 Dashboard</Link>
          <Link href="/planning">📅 Weekly Planning</Link>
          <Link href="/monitoring">📊 Monitoring</Link>
          <Link className="active" href="/performance">🏆 Performance</Link>
          <Link href="/data">⚙️ Data</Link>
        </nav>
      </header>

      <main className="performance-main">
        <div className="performance-wrap">
          <header className="performance-head">
            <div>
              <div className="eyebrow">MT COACH · ANALYTICS</div>
              <h1>MT Performance</h1>
              <p>Performance berdasarkan planning dan realisasi sesi yang tercatat.</p>
            </div>
            <div className="performance-filters">
              <select className="select" value={week} onChange={(e) => setWeek(e.target.value)}>
                {[weekLabel(), "Week 35", "Week 34", "Week 33"].map((w) => <option key={w}>{w}</option>)}
              </select>
              <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                {branches.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </header>

          <section className="performance-grid">
            <div className="card performance-kpi"><div className="kpi-label">Average Session</div><div className="kpi-value">{avgSession}%</div><div className="kpi-note">{rows.length} MT aktif · {week}</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Top MT</div><div className="kpi-value">{top ? `${top.session}%` : "—"}</div><div className="kpi-note">{top?.name ?? "Belum ada data"}</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{attention}</div><div className="kpi-note">Session completion &lt; 90%</div></div>
            <div className="card performance-kpi"><div className="kpi-label">Total Realized</div><div className="kpi-value">{rows.reduce((sum, r) => sum + r.realized, 0)}</div><div className="kpi-note">dari {rows.reduce((sum, r) => sum + r.planned, 0)} planned</div></div>
          </section>

          <section className="section">
            <div className="section-head"><div><h2>🏆 Ranking MT</h2><p className="section-note">Ranking mengikuti filter cabang dan periode yang dipilih.</p></div><button className="secondary-btn" type="button">⬇️ Export</button></div>
            <div className="table-wrap"><table><thead><tr><th>#</th><th>MT</th><th>Cabang</th><th>Planned</th><th>Realized</th><th>Session</th><th>Admin</th><th>LD</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.name}><td>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td><td><strong>{r.name}</strong></td><td>{r.branch}</td><td>{r.planned}</td><td>{r.realized}</td><td className="score">{r.session}%</td><td>—</td><td>—</td><td><span className={`badge ${r.session >= 95 ? "green" : r.session >= 90 ? "blue" : "yellow"}`}>{r.session >= 95 ? "Excellent" : r.session >= 90 ? "Good" : "Attention"}</span></td></tr>)}{rows.length === 0 && <tr><td colSpan={9}><div className="empty-state">Belum ada data performance untuk filter ini.</div></td></tr>}</tbody></table></div>
          </section>

          <section className="section">
            <div className="section-head"><h2>⚠️ Needs Attention</h2></div>
            <div className="attention">{rows.filter((r) => r.session < 90).map((r) => <div className="alert" key={r.name}><div><strong>{r.name} · {r.session}%</strong><small>{r.branch} · Session completion di bawah 90%</small></div><span className="badge yellow">Attention</span></div>)}{attention === 0 && <div className="alert"><div><strong>✅ All good</strong><small>Tidak ada MT yang perlu diperhatikan berdasarkan filter saat ini.</small></div></div>}</div>
          </section>

          <section className="section"><div className="section-head"><h2>📐 Cara Hitung</h2></div><div className="card formula-card"><strong>Session Completion = Realized ÷ Planned × 100</strong><div className="kpi-note">Admin dan LD akan masuk ke score setelah data Monitoring tersedia.</div></div></section>
        </div>
      </main>
    </div>
  );
}
